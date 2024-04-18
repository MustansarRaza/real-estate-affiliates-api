import { Sequelize, Model, DataTypes } from "sequelize";

class Country extends Model {
  public id!: number;
  public name!: string;
  public iso31662Code!: string | null;
  public e164PhonePrefix!: string | null;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "country_id",
        },
        name: {
          type: new DataTypes.STRING(255),
          allowNull: false,
          field: "title",
        },
        iso31662Code: {
          type: new DataTypes.STRING(5),
          allowNull: true,
          field: "loc_code",
        },
        e164PhonePrefix: {
          type: new DataTypes.STRING(5),
          allowNull: true,
          field: "country_code",
        },
      },
      {
        sequelize,
        createdAt: false,
        updatedAt: false,
        tableName: "zn_countries",
      }
    );
  }
}

export default Country;
