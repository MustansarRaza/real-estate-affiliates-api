import { DataTypes, Model, Sequelize } from "sequelize";
import Country from "./country";

export enum LocationLevel {
  COUNTRY = 1,
  REGION = 2,
  CITY = 3,
}

export enum LocationLevelTitle {
  COUNTRY = "country",
  REGION = "region",
  STATE = "state",
  CITY = "city",
  LOCALITY = "locality",
}

/**
 * LocationPopularityIndex provides helps in sorting the different
 * locations that may include couuntry, state or city.
 *
 * Uptill now the popularity index is populated for the cities and
 * especially for the cities of Pakistan i.e. lahore the most popular
 * and Faisalabad comes on the 4th ranking in Pakistan.
 *
 * In future if more cities is to be added then just add their
 * popularity index(ranking) according to their corresponding country.
 */
export const LocationPopularityIndex = {
  CITY: { Lahore: 1, Karachi: 2, Islamabad: 3, Faisalabad: 4 },
  NOTPOPULAR: 0,
};

class Location extends Model {
  public id!: number;
  public name!: string;
  public parentID!: number | null;
  public countryID!: number | null;
  public level1LocationID!: number | null;
  public level3LocationID!: number | null;
  public level!: number;
  public levelTitle!: string;

  public Country!: Country | null;

  public Level1Location!: Location | null;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "cat_id",
        },
        name: {
          type: new DataTypes.STRING(255),
          allowNull: false,
          field: "title",
        },
        parentID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "p",
        },
        countryID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "country_id",
        },
        level1LocationID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "loc_1",
        },
        level3LocationID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "loc_3",
        },
        level: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "cat_level",
        },
        levelTitle: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: "cat_level_title",
        },
      },
      {
        sequelize,
        createdAt: false,
        updatedAt: false,
        tableName: "zn_category",
      }
    );
  }
}

export default Location;
