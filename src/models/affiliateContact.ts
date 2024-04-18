import { Sequelize, Model, DataTypes } from "sequelize";

class AffiliateContact extends Model {
  public affiliateID!: number;
  public affiliateContactID!: number;
  public contactID!: number;
  public ssoID!: string;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        affiliateID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          primaryKey: true,
          field: "affiliate_id",
        },
        affiliateContactID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "affiliate_contact_id",
        },
        contactID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "contact_id",
        },
        ssoID: {
          type: new DataTypes.STRING(36),
          allowNull: true,
          field: "sso_id",
        },
      },
      {
        sequelize,
        createdAt: false,
        updatedAt: false,
        tableName: "zn_pf_affiliate_contacts",
      }
    );
  }
}

export default AffiliateContact;
