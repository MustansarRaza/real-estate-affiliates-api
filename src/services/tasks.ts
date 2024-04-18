import {
  Task,
  TaskType,
  TaskStatus,
  TaskStageID,
  TaskAgainstType,
  User,
  AffiliateContact,
} from "affiliates-api/models";
import { ISO8601DateTime } from "affiliates-api/types";
import { Op, WhereOptions } from "sequelize";

import LeadsService, { LeadDTO } from "./leads";
import TaskTypesService from "./taskTypes";

interface TaskAgainstDTO {
  type: TaskAgainstType;
  id: number;
}

interface ParentTaskTypeDTO {
  id: number;
  title: string;
}

interface TaskTypeDTO {
  id: number;
  title: string;
  parent: ParentTaskTypeDTO | null;
}

interface TaskUser {
  id: number;
  name: string;
  email: string | null;
  mobilePhoneNumber: string | null;
  landLinePhoneNumber: string | null;
  hasWhatsApp: boolean;
}

enum TaskStageDTO {
  PENDING = "pending",
  COMPLETED = "completed",
  DISCARDED = "discarded",
}

export interface TaskDTO {
  id: number;
  status: TaskStatus;
  type: TaskTypeDTO;
  stage: TaskStageDTO;
  against: TaskAgainstDTO;
  addedBy: TaskUser;
  assignedTo: TaskUser;
  title: string | null;
  description: string | null;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
  completedAt: ISO8601DateTime | null;
}

interface OtherServices {
  leads: LeadsService;
  taskTypes: TaskTypesService;
}

interface BySSOIDLookup {
  ssoID: string;
}

interface ByAgainstTypesLookup {
  againstTypes?: TaskAgainstType[];
}

/**
 * Provides access to tasks.
 *
 * Tasks can be against leads or affiliates. A task represents an
 * action by a sales agent or manager.
 *
 * In case the againstTypes is undefined will default to [TaskAgainstType.LEAD]
 * That's for the older versions of the app that  are not sending the against type in the request.
 */
class TasksService {
  constructor(private services: OtherServices) {}

  async list({
    ssoID,
    againstTypes = [TaskAgainstType.LEAD],
  }: BySSOIDLookup & ByAgainstTypesLookup): Promise<TaskDTO[]> {
    const againstFilters = await Promise.all(
      againstTypes.map(async (againstType) => {
        const againstFilter: WhereOptions = {
          againstType: {
            [Op.eq]: againstType,
          },
        };

        switch (againstType) {
          case TaskAgainstType.LEAD:
            const leads = await this.services.leads.list({ ssoID });
            const leadIDs = leads.map((lead: LeadDTO) => lead.id);

            againstFilter.againstID = {
              [Op.in]: leadIDs,
            };

            break;

          case TaskAgainstType.AFFILIATE:
            const affiliateContact = await AffiliateContact.findOne({
              attributes: ["affiliateID"],
              where: {
                ssoID: {
                  [Op.eq]: ssoID,
                },
              },
            });

            againstFilter.againstID = {
              [Op.eq]: affiliateContact.affiliateID,
            };

            break;
        }

        return againstFilter;
      })
    );

    const filters = {
      status: {
        [Op.eq]: TaskStatus.ON,
      },
      stageID: {
        [Op.not]: TaskStageID.DISCARDED,
      },
      [Op.or]: againstFilters,
    };

    const tasks = await Task.findAll({
      where: filters,
      include: [
        {
          model: TaskType,
          attributes: ["id", "title", "parentID"],
          required: true,
          include: [
            {
              model: TaskType,
              as: "ParentTaskType",
              attributes: ["id", "title"],
              required: false,
            },
          ],
        },
        {
          model: User,
          as: "AddedByUser",
          required: true,
        },
        {
          model: User,
          as: "AssignedToUser",
          required: true,
        },
      ],
      order: [
        ["date_added", "DESC"],
        ["task_id", "DESC"],
      ],
    });

    const taskTypesMapping = await this.services.taskTypes.getMappings();

    return tasks.map((task: Task) => ({
      id: task.id,
      status: task.status,
      type: {
        id: task.TaskType.id,
        title: task.TaskType.title,
        parent: this.serializeParentTaskType(task.TaskType.ParentTaskType, taskTypesMapping),
      },
      stage: this.translateStageID(task.stageID),
      against: {
        type: task.againstType,
        id: task.againstID,
      },
      addedBy: this.serializeTaskUser(task.AddedByUser),
      assignedTo: this.serializeTaskUser(task.AssignedToUser),
      title: task.title || null,
      description: task.description || null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt,
    }));
  }

  private serializeTaskUser(user: User): TaskUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email || null,
      mobilePhoneNumber: user.mobilePhoneNumber || null,
      landLinePhoneNumber: user.landLinePhoneNumber || null,
      hasWhatsApp: user.hasWhatsApp || false,
    };
  }

  private serializeParentTaskType(
    taskType: TaskType | null,
    taskTypesMapping: Record<number, TaskType>
  ): ParentTaskTypeDTO | null {
    if (!taskType) {
      return null;
    }

    const rootParentTaskType = this.services.taskTypes.getRootParent(taskType.id, taskTypesMapping);
    return {
      id: rootParentTaskType.id,
      title: rootParentTaskType.title,
    };
  }

  private translateStageID(stageID: TaskStageID): TaskStageDTO {
    switch (stageID) {
      case TaskStageID.PENDING:
        return TaskStageDTO.PENDING;

      case TaskStageID.COMPLETED:
        return TaskStageDTO.COMPLETED;

      case TaskStageID.DISCARDED:
      default:
        return TaskStageDTO.DISCARDED;
    }
  }
}

export default TasksService;
