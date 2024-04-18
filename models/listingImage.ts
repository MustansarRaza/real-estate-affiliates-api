import { Sequelize, Model, DataTypes } from "sequelize";

import MediaBankImage from "./mediaBankImage";

export enum ListingImageCategory {
  PHOTO = "photo",
  VIDEO = "video",
}

class ListingImage extends Model {
  public id!: number;
  public listingID!: number;
  public mediaBankImageID!: number | null;
  public category!: ListingImageCategory;
  public displayOrder!: number | null;
  public isDeleted!: boolean;

  public createdAt!: Date;
  public updatedAt!: Date;

  public MediaBankImage!: MediaBankImage | null;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        listingID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "listing_id",
        },
        mediaBankImageID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "media_bank_id",
        },
        category: {
          type: DataTypes.ENUM,
          allowNull: false,
          values: Object.values(ListingImageCategory),
          field: "media_category",
        },
        displayOrder: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "display_order",
        },
        isDeleted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          field: "deleted",
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
        tableName: "zn_pf_property_media",
      }
    );
  }
}

export default ListingImage;
