import { Sequelize, Model, DataTypes } from "sequelize";

class AgencyConfiguration extends Model {
  public id!: number;
  public agencyId!: number;
  public countryId!: number | null;
  public platformId!: number | null;
  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        agencyId: {
          type: DataTypes.INTEGER,
          field: "agency_id",
        },
        countryId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "country_id",
        },
        platformId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "platform_id",
        },
      },
      {
        sequelize,
        tableName: "agency-configurations",
      }
    );
  }
}

export default AgencyConfiguration;
