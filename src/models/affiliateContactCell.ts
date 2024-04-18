import { Sequelize, Model, DataTypes } from "sequelize";

class AffiliateContactCell extends Model {
  public id!: number;
  public contactID!: number;
  public mobilePhoneNumber!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "id",
        },
        contactID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "contact_id",
        },
        mobilePhoneNumber: {
          type: DataTypes.STRING,
          allowNull: false,
          field: "cell",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "created_at",
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "updated_at",
        },
      },
      {
        sequelize,
        tableName: "affiliate_contact_cells",
      }
    );
  }
}

export default AffiliateContactCell;
