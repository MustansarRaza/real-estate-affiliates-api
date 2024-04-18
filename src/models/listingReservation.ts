import { Sequelize, Model, DataTypes } from "sequelize";
import {
  ListingReservationStatus,
  ListingReservationSource,
  ListingReservationReservedByType,
} from "@pf/taxonomies";
import Listing from "./listing";

class ListingReservation extends Model {
  public id!: number;
  public listingID!: number;
  public leadID!: number | null;
  public reservedFor!: number | null;
  public reservedBy!: number | null;
  public updatedBy!: number | null;

  public status!: ListingReservationStatus | null;
  public comments!: string;
  public source!: ListingReservationSource;

  public createdAt!: Date;
  public updatedAt!: Date;
  public expiryDate!: Date | null;

  public Listing!: Listing | null;
  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER({ length: 11 }),
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "lr_id",
        },
        listingID: {
          type: DataTypes.INTEGER({ length: 11 }),
          allowNull: false,
          field: "listing_id",
        },
        leadID: {
          type: DataTypes.INTEGER({ length: 11 }),
          allowNull: true,
          field: "lead_id",
        },
        status: {
          type: DataTypes.ENUM,
          allowNull: true,
          values: Object.values(ListingReservationStatus),
        },
        comments: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        reservedFor: {
          type: DataTypes.INTEGER({ length: 11 }),
          allowNull: true,
          field: "reserved_for",
        },
        reservedBy: {
          type: DataTypes.INTEGER({ length: 11 }),
          allowNull: true,
          field: "reserved_by",
        },
        reservedByType: {
          type: DataTypes.ENUM,
          defaultValue: ListingReservationReservedByType.AFFILIATE,
          values: Object.values(ListingReservationReservedByType),
          allowNull: false,
          field: "reserved_by_type",
        },
        updatedBy: {
          type: DataTypes.INTEGER({ length: 11 }),
          allowNull: true,
          field: "updated_by",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "date_added",
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "date_updated",
        },
        expiryDate: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "expiry_date",
        },
        source: {
          type: DataTypes.ENUM,
          defaultValue: "staff-app",
          values: Object.values(ListingReservationSource),
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "zn_pf_listings_reservation",
      }
    );
  }
}
export default ListingReservation;
