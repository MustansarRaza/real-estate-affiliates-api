import { Sequelize, Model, DataTypes } from "sequelize";

class PotentialAffiliateVerificationStatus extends Model {
  public id!: number;
  public key!: string;
  public name!: string;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        key: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "zn_pf_potential_affiliate_verification_statuses",
      }
    );
  }
}

export default PotentialAffiliateVerificationStatus;
