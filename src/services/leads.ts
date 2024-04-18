import { SourcePlatform, TaskTypeKey } from "@pf/taxonomies";
import { AppError, ErrorTypes } from "@pf/utils";
import logger from "affiliates-api/logger";
import {
  Address,
  AffiliateAssigneeType,
  AffiliateContact,
  AgencyConfiguration,
  Client,
  Designation,
  Lead,
  LeadClassification,
  leadClassificationFromID,
  LeadClassificationID,
  leadClassificationToID,
  LeadInquiryBudgetCurrency,
  LeadInquiryObjectType,
  LeadLocation,
  LeadLocationType,
  LeadMarket,
  LeadSide,
  LeadSource,
  LeadSourceKey,
  LeadSourceMapping,
  LeadState,
  LeadStatus,
  Purpose,
  purposeFromID,
  purposeToID,
  Task,
  TaskAgainstType,
  TaskStageID,
  TaskStatus,
  TaskType,
  User,
} from "affiliates-api/models";
import { FORMAT_DATE } from "affiliates-api/services/constants";
import { ISO8601DateTime } from "affiliates-api/types";
import { format } from "date-fns";
import { Op, Sequelize } from "sequelize";
import MeService from "./me";
import TaskTypesService from "./taskTypes";

interface LeadInquiryObjectDTO {
  type: LeadInquiryObjectType;
  id: number;
}

interface LeadInquiryBudgetDTO {
  amount: number;
  currency: LeadInquiryBudgetCurrency;
}

interface LeadInquiryDTO {
  object: LeadInquiryObjectDTO | null;
  purpose: Purpose | null;
  categoryID: number | null;
  locationIDs: number[];
  budget: LeadInquiryBudgetDTO | null;
  bedroomCount: number | null;
  bathroomCount: number | null;
}

interface LeadStatusDTO {
  id: number;
  title: string;
}

interface LeadParentTaskTypeDTO {
  id: number;
  title: string;
}

interface LeadTaskTypeDTO {
  id: number;
  title: string;
  parent: LeadParentTaskTypeDTO | null;
}

interface LeadLastTaskDTO {
  id: number;
  title: string | null;
  taskType: LeadTaskTypeDTO;
  dateAdded: ISO8601DateTime;
}

export interface LeadDTO {
  id: number;
  clientID: number;
  status: LeadStatusDTO;
  lastTask: LeadLastTaskDTO | null;
  side: LeadSide;
  market: LeadMarket;
  classification: LeadClassification;
  inquiry: LeadInquiryDTO;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

interface LeadSummaryDTO {
  active: number;
  inactive: number;
  tokenGenerated: number;
  closedWon: number;
  downPayment: number;
  completeDownPayment: number;
}

interface CreateLeadInquiryDTO extends LeadInquiryDTO {
  unitNumber: string | null;
}

export interface CreateLeadDTO {
  clientID: number;
  side: LeadSide;
  market: LeadMarket;
  classification: LeadClassification | null;
  inquiry: CreateLeadInquiryDTO;
  source?: SourcePlatform; // TODO: Make it mandatory as soon as the new app version rolls out
}

interface BySSOIDLookup {
  ssoID: string;
}

export interface ByDateRangeLookUp {
  fromDate?: ISO8601DateTime;
  toDate?: ISO8601DateTime;
}

interface OtherServices {
  me: MeService;
  taskTypes: TaskTypesService;
}

/**
 * Provides access to leads.
 *
 * Leads represent a client's interest in a particular project.
 */
class LeadsService {
  constructor(private services: OtherServices) {}

  /**
   * Gets a list of leads associated with the specified SSO user.
   */
  async list(
    { ssoID }: BySSOIDLookup,
    leadLocationsRequired = true,
    taskDateRange?: ByDateRangeLookUp
  ): Promise<LeadDTO[]> {
    const leads = await Lead.findAll({
      where: {
        state: {
          [Op.eq]: LeadState.ON,
        },
      },
      include: [
        {
          model: Client,
          required: true,
          attributes: [],
          include: [
            {
              model: AffiliateContact,
              required: true,
              attributes: [],
              where: {
                ssoID: {
                  [Op.eq]: ssoID,
                },
              },
            },
          ],
        },
        {
          model: LeadStatus,
          required: true,
          attributes: ["id", "title"],
        },
        {
          model: Task,
          attributes: ["id", "title", "typeID", "createdAt"],
          as: "LastTaskPerformed",
          required: false,
          where: {
            id: {
              [Op.eq]: Sequelize.literal(
                `( SELECT task.task_id FROM zn_pf_task AS task WHERE task.task_against_id = Lead.inquiry_id AND task.status = '${TaskStatus.ON}' AND task.stage_id <> ${TaskStageID.DISCARDED} AND task.task_against = '${TaskAgainstType.LEAD}'` +
                  (taskDateRange?.fromDate
                    ? ` AND task.date_added >= '${format(
                        taskDateRange.fromDate,
                        FORMAT_DATE.FULL_DATE_24_HOUR_FORMAT_DATE_FNS
                      )}'`
                    : ``) +
                  (taskDateRange?.toDate
                    ? ` AND task.date_added <= '${format(
                        taskDateRange.toDate,
                        FORMAT_DATE.FULL_DATE_24_HOUR_FORMAT_DATE_FNS
                      )}'`
                    : ``) +
                  `ORDER BY task.date_added DESC LIMIT 1 )`
              ),
            },
          },
        },
      ],
      order: [
        ["time_added", "DESC"],
        ["inquiry_id", "DESC"],
      ],
    });

    const leadLocationsMapping: { [leadId: number]: LeadLocation[] } = leadLocationsRequired
      ? await this.getLeadLocationsMapping(leads)
      : {};

    const taskTypesMapping = await this.services.taskTypes.getMappings();

    return leads.map((lead: Lead) => {
      if (lead.LastTaskPerformed) {
        lead.LastTaskPerformed.TaskType = taskTypesMapping[lead.LastTaskPerformed.typeID];
        lead.LastTaskPerformed.TaskType.ParentTaskType = lead.LastTaskPerformed.TaskType.parentID
          ? this.services.taskTypes.getRootParent(
              lead.LastTaskPerformed.TaskType.parentID,
              taskTypesMapping
            )
          : null;
      }
      lead.LeadLocations = leadLocationsMapping[lead.id] || [];
      return this.serialize(lead);
    });
  }

  /**
   * Creates a new lead that is owned by the specified {@paramref owner}.
   *
   * This will only work if the owner is a verified affiliate and will
   * fail with {@see AppError} if its not.
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async create(
    { ssoID }: BySSOIDLookup,
    dto: CreateLeadDTO,
    leadsService: any,
    appLocals: any = {}
  ): Promise<LeadDTO> {
    const [owner, status] = await Promise.all([
      this.services.me.owner({ ssoID }),
      LeadStatus.findOne({
        where: {
          isInitial: {
            [Op.eq]: true,
          },
        },
      }),
    ]);

    if (!owner) {
      throw new AppError("Current user has no owner", {
        statusCode: 400,
        extra: {
          ssoID,
        },
      });
    }

    if (!status) {
      throw new AppError("No initial status available", {
        name: ErrorTypes.WrongSetup,
        statusCode: 500,
        extra: {
          ssoID,
        },
      });
    }

    const addressID = await this.createLeadAddressID(dto);

    try {
      const lead = await Lead.create(
        {
          state: LeadState.ON,
          source: dto.source || SourcePlatform.AFFILIATES_MOBILE_APP,
          userID: owner.userID,
          clientID: dto.clientID,
          agencyID: owner.agencyID,
          statusID: status.id,
          side: dto.side,
          market: dto.market,
          classificationID:
            leadClassificationToID(dto.classification) || LeadClassificationID.MODERATE,
          tsrClassificationID:
            leadClassificationToID(dto.classification) || LeadClassificationID.MODERATE,
          inquiryObjectType: dto.inquiry.object?.type || null,
          inquiryObjectID: dto.inquiry.object?.id || null,
          inquiryPurposeID: purposeToID(dto.inquiry.purpose),
          inquiryCategoryID: dto.inquiry.categoryID,
          inquiryBudgetAmount: dto.inquiry.budget?.amount || null,
          inquiryBudgetCurrency: dto.inquiry.budget?.currency || null,
          inquiryBedroomCount: dto.inquiry.bedroomCount,
          inquiryBathroomCount: dto.inquiry.bathroomCount,
          LeadLocations: dto.inquiry.locationIDs.map((locationID: number) => ({
            locationID,
            type: LeadLocationType.INTERESTED_IN,
          })),
          addressID,
        },
        {
          include: [LeadLocation],
        }
      );

      const leadSourceId = await this.getAffiliateLeadSourceId(owner.agencyID);

      if (lead && leadSourceId)
        await LeadSourceMapping.create({
          inquiryId: lead.id,
          inquirySourceId: leadSourceId,
        });

      lead.LeadStatus = status;
      const requestObj = {
        inquiryIds: [lead.id],
        agencyId: owner.agencyID,
        userId: owner.userID,
        appLocals,
      };
      const client = await Client.findOne({
        raw: true,
        attributes: ["userID"],
        where: {
          clientid: {
            [Op.eq]: dto.clientID,
          },
        },
      });
      const user = await User.findOne({
        raw: true,
        attributes: ["designationId"],
        where: {
          id: {
            [Op.eq]: client.userID,
          },
        },
      });

      const { designation_short: designationTitle } = await Designation.findOne({
        raw: true,
        attributes: ["designation_short"],
        where: {
          id: {
            [Op.eq]: user.designationId,
          },
        },
      });

      try {
        if (designationTitle === AffiliateAssigneeType.TAAM.toUpperCase()) {
          logger.info("Sharing lead with support");
          await leadsService.shareWithSupportAuto(requestObj);
        }
      } catch (error) {
        logger.error("Could not share lead with support", error);
        return this.serialize(lead);
      }
      return this.serialize(lead);
    } catch (error) {
      if (error.name === "SequelizeForeignKeyConstraintError") {
        throw new AppError("Invalid category or location ID", {
          statusCode: 400,
          error,
          extra: {
            ssoID,
          },
        });
      }

      throw error;
    }
  }

  /**
   * Gets the leads summary within the provided date range for the user with specified ssoID.
   */
  async listSummary(
    { ssoID }: BySSOIDLookup,
    dateRange: ByDateRangeLookUp
  ): Promise<LeadSummaryDTO> {
    const leadsSummary = {
      active: 0,
      inactive: 0,
      tokenGenerated: 0,
      closedWon: 0,
      downPayment: 0,
      completeDownPayment: 0,
    };

    if (!dateRange.fromDate) {
      const firstLead = await this.getFirstLead({ ssoID });

      if (!firstLead) return leadsSummary;
      dateRange.fromDate = firstLead.createdAt.toString();
    }

    const leads = await this.list({ ssoID }, false, dateRange);

    if (leads.length === 0) return leadsSummary;

    const activeLeadIds = this.getActiveInactiveLeadsCount(
      leads,
      dateRange.toDate || null,
      leadsSummary
    );

    if (activeLeadIds.length === 0) return leadsSummary;

    const leadsWithLastWinningTask = await this.getLeadsLastWinningTask(activeLeadIds, dateRange);

    this.getWinningLeadsCount(leadsWithLastWinningTask, leadsSummary);

    return leadsSummary;
  }

  private getActiveInactiveLeadsCount(
    leads: LeadDTO[],
    maxDate: string | null,
    leadsSummary: LeadSummaryDTO
  ): number[] {
    const activeLeadIds: number[] = [];

    leads.forEach((lead: LeadDTO) => {
      if (lead.lastTask) {
        leadsSummary.active += 1;
        activeLeadIds.push(lead.id);
      } else {
        if (maxDate) {
          if (lead.createdAt <= maxDate) leadsSummary.inactive += 1;
        } else leadsSummary.inactive += 1;
      }
    });

    return activeLeadIds;
  }

  private getWinningLeadsCount(leads: Lead[], leadsSummary: LeadSummaryDTO): void {
    leads.forEach((lead: Lead) => {
      if (lead.LastTaskPerformed) {
        switch (lead.LastTaskPerformed.TaskType.key) {
          case TaskTypeKey.GENERATE_TOKEN:
            leadsSummary.tokenGenerated += 1;
            break;
          case TaskTypeKey.PARTIAL_DOWN_PAYMENT:
            leadsSummary.downPayment += 1;
            break;
          case TaskTypeKey.COMPLETE_DOWN_PAYMENT:
            leadsSummary.completeDownPayment += 1;
            break;
          case TaskTypeKey.CLOSED_WON:
            leadsSummary.closedWon += 1;
        }
      }
    });
  }

  /**
   * Gets the first lead added by the user with specified ssoID, if there exists one.
   * @param { ssoID }
   * @returns Promise of a Lead or null
   */
  private getFirstLead({ ssoID }: BySSOIDLookup): Promise<Lead | null> {
    return Lead.findOne({
      where: {
        state: {
          [Op.eq]: LeadState.ON,
        },
      },
      include: [
        {
          model: Client,
          required: true,
          attributes: [],
          include: [
            {
              model: AffiliateContact,
              required: true,
              attributes: [],
              where: {
                ssoID: {
                  [Op.eq]: ssoID,
                },
              },
            },
          ],
        },
      ],
      order: [["time_added", "ASC"]],
    });
  }

  /**
   *
   * @param activeLeadIds to find the winning task against only the ids
   * of leads that have atleast one task added
   * @param dateRange (optional) can be provided to consider the tasks
   * against the leads that were added in the specified date range
   * @returns Promise of an array of leads
   */
  private getLeadsLastWinningTask(
    activeLeadIds: number[],
    dateRange?: ByDateRangeLookUp
  ): Promise<Lead[]> {
    return Lead.findAll({
      attributes: ["id"],
      where: {
        id: {
          [Op.in]: activeLeadIds,
        },
      },
      include: [
        {
          model: Task,
          attributes: ["id"],
          as: "LastTaskPerformed",
          required: true,
          where: {
            id: {
              [Op.eq]: Sequelize.literal(
                `( SELECT task.task_id FROM zn_pf_task AS task INNER JOIN zn_pf_task_types AS taskType ON task.task_type_id = taskType.task_type_id AND taskType.key IN ('${TaskTypeKey.GENERATE_TOKEN}', '${TaskTypeKey.PARTIAL_DOWN_PAYMENT}', '${TaskTypeKey.COMPLETE_DOWN_PAYMENT}', '${TaskTypeKey.CLOSED_WON}') WHERE task.task_against_id = Lead.inquiry_id AND task.status = '${TaskStatus.ON}' AND task.stage_id <> ${TaskStageID.DISCARDED} AND task.task_against = '${TaskAgainstType.LEAD}'` +
                  (dateRange?.fromDate
                    ? ` AND task.date_added >= '${format(
                        dateRange.fromDate,
                        FORMAT_DATE.FULL_DATE_24_HOUR_FORMAT_DATE_FNS
                      )}'`
                    : ``) +
                  (dateRange?.toDate
                    ? ` AND task.date_added <= '${format(
                        dateRange.toDate,
                        FORMAT_DATE.FULL_DATE_24_HOUR_FORMAT_DATE_FNS
                      )}'`
                    : ``) +
                  ` ORDER BY task.date_added DESC LIMIT 1 )`
              ),
            },
          },
          include: [
            {
              model: TaskType,
              attributes: ["key"],
              required: true,
            },
          ],
        },
      ],
    });
  }

  /**
   * Return a Promise of a mapping that Provides a list of LeadLocations
   * (if exists) against every leadId of lead from {@param leads}.
   */
  private async getLeadLocationsMapping(
    leads: Lead[]
  ): Promise<{ [leadId: number]: LeadLocation[] }> {
    const leadIds = leads.map((lead: Lead) => lead.id);

    const locations = await LeadLocation.findAll({
      attributes: ["leadID", "locationID"],
      where: {
        leadID: {
          [Op.in]: leadIds,
        },
      },
    });

    const leadLocationsMapping: { [leadId: number]: LeadLocation[] } = {};

    locations.forEach((leadLocation: LeadLocation) => {
      if (leadLocationsMapping.hasOwnProperty(leadLocation.leadID))
        leadLocationsMapping[leadLocation.leadID].push(leadLocation);
      else leadLocationsMapping[leadLocation.leadID] = [leadLocation];
    });

    return leadLocationsMapping;
  }

  /**
   * Serializes a queried {@see Lead} model instance into a DTO.
   */
  private serialize(lead: Lead): LeadDTO {
    return {
      id: lead.id,
      clientID: lead.clientID,
      status: {
        id: lead.LeadStatus.id,
        title: lead.LeadStatus.title,
      },
      lastTask: this.serializeTask(lead.LastTaskPerformed),
      side: lead.side,
      market: lead.market,
      classification:
        leadClassificationFromID(lead.classificationID) || LeadClassification.MODERATE,
      inquiry: {
        object: this.serializeInquiryObject(lead),
        purpose: this.serializeInquiryPurpose(lead),
        categoryID: lead.inquiryCategoryID,
        locationIDs: lead.LeadLocations.map(({ locationID }: LeadLocation) => locationID),
        budget: this.serializeInquiryBudget(lead),
        bedroomCount: lead.inquiryBedroomCount,
        bathroomCount: lead.inquiryBathroomCount,
      },
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    };
  }

  /**
   * Serializes a Task {@param task} instance into a DTO.
   */
  private serializeTask(task: Task | null): LeadLastTaskDTO | null {
    if (!task) return null;

    return {
      id: task.id,
      title: task.title || null,
      taskType: {
        id: task.TaskType.id,
        title: task.TaskType.title,
        parent: this.serializeParentTaskType(task.TaskType.ParentTaskType),
      },
      dateAdded: task.createdAt.toISOString(),
    };
  }

  private serializeParentTaskType(taskType: TaskType | null): LeadParentTaskTypeDTO | null {
    if (!taskType) return null;

    return {
      id: taskType.id,
      title: taskType.title,
    };
  }

  /**
   * Serializes the purpose for a lead inquiry.
   *
   * We force the purpose to for-sale if the market is primary because
   * that's the definition of the primary market: it's all BUY. The
   * database is wrong sometimes or is missing the value.
   */
  private serializeInquiryPurpose(lead: Lead): Purpose | null {
    if (lead.market === LeadMarket.PRIMARY) {
      return Purpose.FOR_SALE;
    }

    return purposeFromID(lead.inquiryPurposeID);
  }

  private serializeInquiryObject(lead: Lead): LeadInquiryObjectDTO | null {
    if (!lead.inquiryObjectType || !lead.inquiryObjectID) {
      return null;
    }

    return {
      type: lead.inquiryObjectType,
      id: lead.inquiryObjectID,
    };
  }

  private serializeInquiryBudget(lead: Lead): LeadInquiryBudgetDTO | null {
    if (!lead.inquiryBudgetAmount || !lead.inquiryBudgetCurrency) {
      return null;
    }

    return {
      amount: lead.inquiryBudgetAmount,
      currency: lead.inquiryBudgetCurrency,
    };
  }

  private async createLeadAddressID(lead: CreateLeadDTO): Promise<number | null> {
    if (lead.side !== LeadSide.SUPPLY || lead.market !== LeadMarket.SECONDARY) {
      return null;
    }

    const locationID = lead.inquiry.locationIDs.slice(-1).pop();
    const address = await Address.create({
      locationID,
      unitNumber: lead.inquiry.unitNumber,
    });

    return address.id;
  }

  private async getAffiliateLeadSourceId(agencyId: number): Promise<number | null> {
    const agencyConfiguration = await AgencyConfiguration.findOne({
      attributes: ["id", "platformId"],
      where: {
        agencyId: { [Op.eq]: agencyId },
      },
    });

    if (!agencyConfiguration) return null;

    const affiliateInquirySource = await LeadSource.findOne({
      attributes: ["id"],
      where: {
        platformId: { [Op.eq]: agencyConfiguration.platformId },
        key: { [Op.eq]: LeadSourceKey.AFFILIATE },
      },
    });

    return affiliateInquirySource?.id || null;
  }
}

export default LeadsService;
