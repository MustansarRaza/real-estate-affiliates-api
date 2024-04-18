import { Sequelize, Model, DataTypes } from "sequelize";

class Contact extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public landLinePhoneNumber!: string;
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
          field: "contact_id",
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          field: "contact_person",
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        landLinePhoneNumber: {
          type: DataTypes.STRING,
          allowNull: false,
          field: "phone",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "date_added",
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "date_updated",
        },
      },
      {
        sequelize,
        tableName: "zn_pf_contacts",
      }
    );
  }
}

export default Contact;
