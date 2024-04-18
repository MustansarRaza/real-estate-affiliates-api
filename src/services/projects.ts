import {
  ListingAgainstType,
  Project,
  ProjectAffiliateVisibilityID,
  ProjectImage,
  ProjectStatus,
} from "affiliates-api/models";
import { ISO8601DateTime } from "affiliates-api/types";
import { Op } from "sequelize";
import CommissionsService, { AffiliateCommissionDTO, ProjectCommissionDTO } from "./commissions";
import ListingsService, { ListingsStatsDTO } from "./listings";
import LocationsService from "./locations";
import MeService from "./me";

interface ProjectImageSize {
  width: number;
  height: number;
}

interface ProjectImageVariation {
  name: string;
  url: string;
  size: ProjectImageSize;
}

interface ProjectImageDTO {
  id: number;
  title: string | null;
  variations: ProjectImageVariation[];
}

interface ProjectDTO {
  id: number;
  externalID: number;
  slug: string;
  status: ProjectStatus;
  name: string;
  description: string | null;
  address: string | null;
  agencyID: number | null;
  locationID: number | null;
  cityID: number | null;
  url: string | null;
  images: ProjectImageDTO[];
  commissionPercentage: number | null;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
  readonly listingsStats: ListingStatsPerProject;
  affiliateCommissionStats: ProjectCommissionDTO;
  affiliateCommission: AffiliateCommissionDTO | null;
  maxEarningPotential: number | null;
}

interface ProjectAdditionalData {
  projectCityId: number | null;
  activeListingsStats: ListingsStatsDTO | null;
  soldListingCount: number;
  affiliateCommissionStats: ProjectCommissionDTO | null;
  affiliateCommission: AffiliateCommissionDTO | null;
}

interface ListingStatsPerProject {
  count: number;
  minPrice: number | null;
  maxPrice: number | null;
  categoryIDs: number[];
  soldCount: number;
}

interface ByAgencyIDLookup {
  agencyID: number;
}

interface OtherServices {
  me: MeService;
  listings: ListingsService;
  commissions: CommissionsService;
  locations: LocationsService;
}

/**
 * Provides access to projects.
 */
class ProjectsService {
  private static imageSizes: ProjectImageSize[] = [
    { width: 240, height: 180 },
    { width: 400, height: 300 },
    { width: 600, height: 450 },
    { width: 800, height: 600 },
  ];

  constructor(private services: OtherServices) {}

  /**
   * Gets a list of all available projects for affiliates.
   */
  async list({ agencyID }: ByAgencyIDLookup, ssoID: string): Promise<ProjectDTO[]> {
    const projects = await Project.findAll({
      where: {
        status: {
          [Op.eq]: ProjectStatus.ON,
        },
        affiliateVisibility: {
          [Op.eq]: ProjectAffiliateVisibilityID.VISIBLE,
        },
        agencyID: {
          [Op.eq]: agencyID,
        },
      },
      include: [
        {
          model: ProjectImage,
          separate: true,
          where: {
            baseURL: {
              [Op.ne]: null,
            },
            path: {
              [Op.ne]: null,
            },
            deletedAt: {
              [Op.eq]: null,
            },
          },
          order: [["id", "ASC"]],
        },
      ],
      order: [
        ["date_added", "DESC"],
        ["project_id", "DESC"],
      ],
    });

    const projectIDs = projects.map((project: Project) => project.id);

    const locationIDs: number[] = projects
      .map((project: Project) => project.locationID)
      .filter((locationId: number) => locationId !== null);

    const projectLocationToCityIdMap = await this.services.locations.getLocationToCityIDMapping(
      locationIDs
    );

    const activeListingsStatsPerProject = await this.services.listings.statsGroupedBy({
      agencyID: agencyID,
      againstType: ListingAgainstType.PROJECT,
      againstIDs: projectIDs,
    });

    const soldListingCountPerProject = await this.services.listings.getSoldListingsCount(
      agencyID,
      projectIDs
    );

    const affiliateTypeId = await this.services.me.type({ ssoID });

    const commissionStatsPerProject = await this.services.commissions.getProjectCommissionStats({
      projectIDs,
      affiliateTypeId,
    });

    const affiliateCommissionPerProject = await this.services.commissions.getCommissionsBreakdownForAffiliate(
      {
        projectIDs,
        affiliateTypeId,
      }
    );

    return projects.map((project: Project) =>
      this.serialize(project, {
        projectCityId: project.locationID
          ? projectLocationToCityIdMap.get(project.locationID) || null
          : null,
        activeListingsStats: activeListingsStatsPerProject.get(project.id) || null,
        soldListingCount: soldListingCountPerProject.get(project.id) || 0,
        affiliateCommissionStats: commissionStatsPerProject.get(project.id) || null,
        affiliateCommission: affiliateCommissionPerProject[project.id] || null,
      })
    );
  }

  private serialize(project: Project, additionalData: ProjectAdditionalData): ProjectDTO {
    return {
      id: project.id,
      externalID: project.externalID,
      slug: project.slug,
      status: project.status,
      name: project.name,
      description: project.description,
      address: this.cleanString(project.address),
      agencyID: project.agencyID,
      locationID: project.locationID,
      cityID: additionalData.projectCityId,
      url: project.url,
      images: project.ProjectImages.map((image: ProjectImage) => ({
        id: image.id,
        title: image.title,
        variations: this.createImageVariations(image),
      })),
      commissionPercentage: project.commissionPercentage,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      listingsStats: additionalData.activeListingsStats
        ? { soldCount: additionalData.soldListingCount, ...additionalData.activeListingsStats }
        : {
            count: 0,
            minPrice: null,
            maxPrice: null,
            categoryIDs: [],
            soldCount: additionalData.soldListingCount,
          },
      affiliateCommissionStats: additionalData.affiliateCommissionStats || { max: null, min: null },
      affiliateCommission: additionalData.affiliateCommission,
      maxEarningPotential:
        additionalData.affiliateCommissionStats?.max && additionalData.activeListingsStats?.maxPrice
          ? (additionalData.affiliateCommissionStats.max / 100) *
            additionalData.activeListingsStats.maxPrice
          : null,
    };
  }

  /**
   * Creates a list of URL's to access the specified image
   * in various resolution.
   */
  private createImageVariations(image: ProjectImage): ProjectImageVariation[] {
    return ProjectsService.imageSizes.map((size: ProjectImageSize) => ({
      name: `${size.width}x${size.height}`,
      url: `${image.baseURL}/w${size.width}_h${size.height}/${image.path}`,
      size,
    }));
  }

  /**
   * Temporary cleaning function for fields that contain 'N.A',
   * which is essentially the same as `null`.
   *
   * This kind of stuff should be handled by the client. The
   * client can choose to render `N.A`, or to hide the field.
   * This should not be stored or returned like this.
   */
  private cleanString(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const trimmedValue = value.trim();
    return trimmedValue !== "N.A" ? trimmedValue : null;
  }
}

export default ProjectsService;
