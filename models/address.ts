import { Sequelize, Model, DataTypes } from "sequelize";

class Address extends Model {
  public id!: number;
  public locationID!: number | null;
  public countryLocationID!: number | null;
  public regionLocationID!: number | null;
  public cityLocationID!: number | null;
  public localityLocationID!: number | null;
  public phaseLocationID!: number | null;
  public unitNumber!: string | null;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "address_id",
        },
        locationID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "location_id",
        },
        countryLocationID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "state_id",
        },
        regionLocationID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "region_id",
        },
        cityLocationID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "city_id",
        },
        localityLocationID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "locality_id",
        },
        phaseLocationID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "phase_id",
        },
        unitNumber: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "unit_number",
        },
      },
      {
        sequelize,
        createdAt: false,
        updatedAt: false,
        tableName: "zn_pf_addresses",
      }
    );
  }
}

export default Address;
