import { DataTypes, Model, Sequelize } from "sequelize";

export enum AffiliateAssigneeType {
  BDM = "bdm",
  COORDINATOR = "coordinator",
  TAAM = "taam",
}

class AffiliateAssignee extends Model {
  public id!: number;
  public affiliateID!: number;
  public type!: AffiliateAssigneeType;
  public userID!: number;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "affiliate_assignee_id",
        },
        affiliateID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "affiliate_id",
        },
        type: {
          type: DataTypes.ENUM,
          values: Object.values(AffiliateAssigneeType),
          allowNull: false,
          field: "assignee_type",
        },
        userID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "assignee_id",
        },
      },
      {
        sequelize,
        createdAt: false,
        updatedAt: false,
        tableName: "zn_pf_affiliate_assignees",
      }
    );
  }
}

export default AffiliateAssignee;
