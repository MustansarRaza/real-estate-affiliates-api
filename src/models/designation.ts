import { Sequelize, Model, DataTypes } from "sequelize";

class Designation extends Model {
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
          type: DataTypes.STRING(150),
          allowNull: true,
          field: "designation_text",
        },
        designation_short: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
      },
      {
        sequelize,
        createdAt: false,
        updatedAt: false,
        tableName: "zn_user_designation",
      }
    );
  }
}

export default Designation;
