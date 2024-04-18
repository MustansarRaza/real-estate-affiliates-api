import { Sequelize, Model, DataTypes } from "sequelize";

export enum LeadLocationType {
  INTERESTED_IN = "interested_in",
}

class LeadLocation extends Model {
  public id!: number;
  public leadID!: number;
  public locationID!: number;
  public type!: LeadLocationType;
  public createdAt!: Date;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        leadID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "inquiry_id",
        },
        locationID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "location_id",
        },
        type: {
          type: DataTypes.ENUM,
          allowNull: false,
          values: Object.values(LeadLocationType),
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "created_at",
        },
      },
      {
        sequelize,
        createdAt: "createdAt",
        updatedAt: false,
        tableName: "zn_internal_inquiries_locations",
      }
    );
  }
}

export default LeadLocation;
