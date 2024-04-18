import { Sequelize, Model, DataTypes } from "sequelize";

export enum LeadSourceKey {
  AFFILIATE = "affiliate",
}

class LeadSource extends Model {
  public id!: number;
  public name!: string | null;
  public key!: string;
  public platformId!: number | null;
  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "inquiry_source_id",
        },
        name: {
          type: DataTypes.STRING(200),
          allowNull: true,
          field: "source_title",
        },
        key: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        platformId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "platform_id",
        },
      },
      {
        sequelize,
        tableName: "zn_internal_inquiries_source",
      }
    );
  }
}

export default LeadSource;
