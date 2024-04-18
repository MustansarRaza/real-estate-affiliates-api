import { DataTypes, Model, Sequelize } from "sequelize";

class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string | null;
  public mobilePhoneNumber!: string | null;
  public landLinePhoneNumber!: string | null;
  public hasWhatsApp!: boolean | null;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "userid",
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        mobilePhoneNumber: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "cell",
        },
        landLinePhoneNumber: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "phone",
        },
        email: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "email",
        },
        designationId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: "designation",
        },
        hasWhatsApp: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          field: "whatsapp_opt_in",
        },
      },
      {
        sequelize,
        createdAt: false,
        updatedAt: false,
        tableName: "zn_users",
      }
    );
  }
}

export default User;
