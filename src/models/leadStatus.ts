import { Sequelize, Model, DataTypes } from "sequelize";

class LeadStatus extends Model {
  public id!: number;
  public title!: string;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "status_id",
        },
        title: {
          type: new DataTypes.STRING(50),
          allowNull: false,
          field: "status_title",
        },
        isInitial: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          field: "start_status",
        },
      },
      {
        sequelize,
        createdAt: false,
        updatedAt: false,
        tableName: "zn_internal_inquiries_status",
      }
    );
  }
}

export default LeadStatus;
