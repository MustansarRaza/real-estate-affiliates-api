import { Sequelize, Model, DataTypes } from "sequelize";

import TaskType from "./taskType";
import User from "./user";

export enum TaskStatus {
  ON = "on",
  DELETED = "deleted",
}

export enum TaskStageID {
  PENDING = 1,
  COMPLETED = 3,
  DISCARDED = 4,
}

export enum TaskAgainstType {
  AFFILIATE = "affiliate",
  OTHERS = "others",
  LEAD = "lead",
}

class Task extends Model {
  public id!: number;
  public status!: TaskStatus | null;
  public typeID!: number;
  public stageID!: TaskStageID;
  public againstType!: TaskAgainstType;
  public againstID!: number;
  public addedByUserID!: number;
  public assignedToUserID!: number;
  public title!: string | null;
  public description!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  public completedAt!: Date | null;

  public TaskType!: TaskType;
  public AddedByUser!: User;
  public AssignedToUser!: User;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "task_id",
        },
        status: {
          type: DataTypes.ENUM,
          allowNull: true,
          values: Object.values(TaskStatus),
        },
        typeID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "task_type_id",
        },
        stageID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "stage_id",
        },
        againstType: {
          type: DataTypes.ENUM,
          allowNull: false,
          values: Object.values(TaskAgainstType),
          field: "task_against",
        },
        againstID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "task_against_id",
        },
        addedByUserID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "added_by",
        },
        assignedToUserID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "assigned_to",
        },
        title: {
          type: new DataTypes.STRING(255),
          allowNull: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "date_added",
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "date_updated",
        },
        completedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "date_completed",
        },
      },
      {
        sequelize,
        createdAt: false,
        updatedAt: false,
        tableName: "zn_pf_task",
      }
    );
  }
}

export default Task;
