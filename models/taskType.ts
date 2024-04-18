import { DataTypes, Model, Sequelize } from "sequelize";

class TaskType extends Model {
  public id!: number;
  public title!: string;
  public key!: string | null;
  public parentID!: number | null;

  public ParentTaskType!: TaskType | null;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "task_type_id",
        },
        title: {
          type: new DataTypes.STRING(255),
          allowNull: false,
        },
        key: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        parentID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "parent_id",
        },
      },
      {
        sequelize,
        createdAt: false,
        updatedAt: false,
        tableName: "zn_pf_task_types",
      }
    );
  }
}

export default TaskType;
