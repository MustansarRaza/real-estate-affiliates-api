import { Sequelize, Model, DataTypes } from "sequelize";

class AffiliateCommissionPropertyType extends Model {
  public id!: number;
  public name!: string;
  public key!: string;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        key: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
      },
      {
        sequelize,
        tableName: "zn_pf_affiliate_commission_property_type",
      }
    );
  }
}

export default AffiliateCommissionPropertyType;
