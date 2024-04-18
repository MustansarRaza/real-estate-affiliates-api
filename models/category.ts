import { DataTypes, Model, Sequelize } from "sequelize";

export enum PopularCategoryKey {
  RESIDENTIAL_APARTMENT = "residential_apartment",
  RESIDENTIAL_PLOTS = "residential_plots",
  SHOPS = "shops",
  HOTEL_APARTMENT = "hotel_apartment",
}

export enum PopularCategoryIndex {
  RESIDENTIAL_APARTMENT = 1,
  RESIDENTIAL_PLOTS = 2,
  SHOPS = 3,
  HOTEL_APARTMENT = 4,
  NOT_POPULAR = 0,
}

class Category extends Model {
  public id!: number;
  public name!: string;
  public key!: string;
  public nameSingular!: string;
  public orderIndex!: number;
  public slug!: string;
  public parentID!: number | null;
  public platformId!: number | null;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "type_id",
        },
        name: {
          type: new DataTypes.STRING(255),
          allowNull: false,
          field: "type_title",
        },
        key: {
          type: new DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        nameSingular: {
          type: new DataTypes.STRING(255),
          allowNull: false,
          field: "type_alternate_title",
        },
        orderIndex: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "type_order",
        },
        slug: {
          type: new DataTypes.STRING(255),
          allowNull: false,
          field: "type_htaccess",
        },
        parentID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "p",
        },
        platformId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "platform_id",
        },
      },
      {
        sequelize,
        createdAt: false,
        updatedAt: false,
        tableName: "zn_type",
      }
    );
  }
}

/**
 * Converts from `key` string value representing a property type
 *  into its corresponding popularity index.
 */
export const popularCategoryKeyToIndex = (popularCategoryKey: string): PopularCategoryIndex => {
  switch (popularCategoryKey) {
    case PopularCategoryKey.RESIDENTIAL_APARTMENT:
      return PopularCategoryIndex.RESIDENTIAL_APARTMENT;

    case PopularCategoryKey.RESIDENTIAL_PLOTS:
      return PopularCategoryIndex.RESIDENTIAL_PLOTS;

    case PopularCategoryKey.SHOPS:
      return PopularCategoryIndex.SHOPS;

    case PopularCategoryKey.HOTEL_APARTMENT:
      return PopularCategoryIndex.HOTEL_APARTMENT;

    default:
      return PopularCategoryIndex.NOT_POPULAR;
  }
};

export default Category;
