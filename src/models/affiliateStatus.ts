import { Sequelize, Model, DataTypes } from "sequelize";

export enum AffiliateStatusKey {
  NEW = "new",
  MOU_SIGNED = "mou_signed",
  APPROACHED = "approached",
  REJECTED = "rejected",
  NOT_INTERESTED = "not_interested",
  INTERESTED = "interested",
  AFFILIATE_AGREEMENT_ACCEPTED = "affiliate_agreement_accepted",
}

class AffiliateStatus extends Model {
  public id!: number;
  public name!: string;
  public key!: string;

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
        name: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: "title",
        },
        key: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "zn_pf_affiliate_status",
      }
    );
  }
}

export default AffiliateStatus;
