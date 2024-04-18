import { Sequelize, Model, DataTypes } from "sequelize";

class ClientPhoneNumber extends Model {
  public id!: number;
  public clientID!: number;
  public value!: string;
  public updatedAt!: Date;
  public shortValue!: string;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "cc_id",
        },
        clientID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "client_id",
        },
        value: {
          type: new DataTypes.STRING(100),
          allowNull: false,
          field: "cell",
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "datetime_updated",
        },
        shortValue: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "cell_short",
        },
      },
      { sequelize, createdAt: false, tableName: "zn_client_cells" }
    );
  }
}

export default ClientPhoneNumber;
