import { Sequelize, Model, DataTypes } from "sequelize";

import { AffiliateTypeID } from "./affiliateType";

class Affiliate extends Model {
  public id!: number;
  public typeID!: AffiliateTypeID;
  public affiliateStatus!: number | null;
  public agencyID!: number;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "affiliate_id",
        },
        typeID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "affiliate_type",
        },
        affiliateStatus: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: null,
          field: "affiliate_status",
        },
        agencyID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          unique: true,
          field: "agency_id",
        },
      },
      { sequelize, createdAt: false, updatedAt: false, tableName: "zn_pf_affiliate" }
    );
  }
}

export default Affiliate;
