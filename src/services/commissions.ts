import { AffiliateCommissionType } from "@pf/taxonomies";
import { AffiliateCommission } from "affiliates-api/models";
import { maxBy, minBy } from "lodash";
import { Op, WhereOptions } from "sequelize";

export interface ProjectCommissionDTO {
  max: number | null;
  min: number | null;
}

export interface AffiliateCommissionDTO {
  [commissionType: string]: {
    [propertyTypeId: number]: AffiliateCommission[];
  };
}

export interface AffiliateProjectCommissionDTO {
  [projectID: number]: AffiliateCommissionDTO;
}

type ByProjectIDLookup = {
  projectIDs: number[];
};

type ByAffiliateTypeIDLookup = {
  affiliateTypeId: number | null;
};

type ByFiltersLookup = {
  createdBy?: number;
  propertyTypeId?: number;
  commissionType?: AffiliateCommissionType;
};

type AffiliateCommissionLookupOptions = ByProjectIDLookup &
  ByAffiliateTypeIDLookup &
  ByFiltersLookup;

class CommissionsService {
  async getDetailsFor(
    options: AffiliateCommissionLookupOptions
  ): Promise<{ [projectID: number]: AffiliateCommission[] }> {
    const unformattedDate = new Date();
    unformattedDate.setHours(0, 0, 0, 0);
    const currentDate = unformattedDate.toISOString();

    const commissionDetails = await AffiliateCommission.findAll({
      where: {
        [Op.and]: this.createFiltersForAffiliateCommission(options),
        [Op.or]: [
          {
            startDate: {
              [Op.is]: null,
            },
            endDate: {
              [Op.is]: null,
            },
          },
          {
            startDate: {
              [Op.not]: null,
              [Op.lte]: currentDate,
            },
            endDate: {
              [Op.is]: null,
            },
          },
          {
            startDate: {
              [Op.is]: null,
            },
            endDate: {
              [Op.not]: null,
              [Op.gte]: currentDate,
            },
          },
          {
            startDate: {
              [Op.not]: null,
              [Op.lte]: currentDate,
            },
            endDate: {
              [Op.not]: null,
              [Op.gte]: currentDate,
            },
          },
        ],
      },
      raw: true,
    });

    const projectAndCommissionsMapping: { [projectID: number]: AffiliateCommission[] } = {};
    commissionDetails.forEach((row: AffiliateCommission) => {
      if (projectAndCommissionsMapping.hasOwnProperty(row.projectId))
        projectAndCommissionsMapping[row.projectId].push(row);
      else projectAndCommissionsMapping[row.projectId] = [row];
    });

    return projectAndCommissionsMapping;
  }

  async getCommissionsBreakdownForAffiliate(
    options: AffiliateCommissionLookupOptions
  ): Promise<AffiliateProjectCommissionDTO> {
    const projectAndCommissionsMapping = await this.getDetailsFor(options);

    const avaiableCommissionProjectIDs = Object.keys(projectAndCommissionsMapping);

    const affiliateCommissionBreakdown: AffiliateProjectCommissionDTO = {};
    avaiableCommissionProjectIDs.forEach((projectID) => {
      const projectCommissions = projectAndCommissionsMapping[parseInt(projectID, 10)] || [];

      projectCommissions.forEach((commission) => {
        if (affiliateCommissionBreakdown.hasOwnProperty(commission.projectId))
          if (
            affiliateCommissionBreakdown[commission.projectId].hasOwnProperty(
              commission.commissionType
            )
          )
            if (
              affiliateCommissionBreakdown[commission.projectId][
                commission.commissionType
              ].hasOwnProperty(commission.propertyTypeId)
            )
              affiliateCommissionBreakdown[commission.projectId][commission.commissionType][
                commission.propertyTypeId
              ].push(commission);
            else
              affiliateCommissionBreakdown[commission.projectId][commission.commissionType][
                commission.propertyTypeId
              ] = [commission];
          else
            affiliateCommissionBreakdown[commission.projectId][commission.commissionType] = {
              [commission.propertyTypeId]: [commission],
            };
        else
          affiliateCommissionBreakdown[commission.projectId] = {
            [commission.commissionType]: { [commission.propertyTypeId]: [commission] },
          };
      });
    });

    return affiliateCommissionBreakdown;
  }

  async getProjectCommissionStats(
    options: AffiliateCommissionLookupOptions
  ): Promise<Map<number, ProjectCommissionDTO>> {
    const projectAndCommissionsMapping = await this.getDetailsFor(options);

    const projectCommissionStats = new Map<number, ProjectCommissionDTO>();
    Object.keys(projectAndCommissionsMapping).forEach((projectID) => {
      const maxCommission = maxBy(
        projectAndCommissionsMapping[+projectID],
        (affiliateCommission) =>
          affiliateCommission.commission + affiliateCommission.classifiedCredits!
      );
      const minCommission = minBy(
        projectAndCommissionsMapping[+projectID],
        (affiliateCommission) =>
          affiliateCommission.commission + affiliateCommission.classifiedCredits!
      );

      return projectCommissionStats.set(+projectID, {
        max: maxCommission?.commission! + maxCommission?.classifiedCredits!,
        min: minCommission?.commission! + minCommission?.classifiedCredits!,
      });
    });

    return projectCommissionStats;
  }

  private createFiltersForAffiliateCommission(
    options: AffiliateCommissionLookupOptions
  ): WhereOptions[] {
    const filters: WhereOptions[] = [
      {
        affiliateTypeId: {
          [Op.eq]: options.affiliateTypeId,
        },
        projectId: {
          [Op.in]: options.projectIDs,
        },
      },
    ];

    if (options?.createdBy) {
      filters.push({
        createdBy: {
          [Op.eq]: options.createdBy,
        },
      });
    }
    if (options?.propertyTypeId) {
      filters.push({
        propertyTypeId: {
          [Op.eq]: options.propertyTypeId,
        },
      });
    }
    if (options?.commissionType) {
      filters.push({
        commissionType: {
          [Op.eq]: options.commissionType,
        },
      });
    }

    return filters;
  }
}

export default CommissionsService;
