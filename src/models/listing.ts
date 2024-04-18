import { DataTypes, Model, Sequelize } from "sequelize";
import Address from "./address";
import { AreaUnitID } from "./areaUnit";
import ListingImage from "./listingImage";
import { PurposeID } from "./purpose";

export enum ListingAgainstType {
  PROJECT = "project",
  LEAD = "lead",
}

export enum ListingStatusID {
  AVAILABLE = 1,
  CLOSED = 2,
  TOKEN_PAYMENT = 3,
  RESERVED_HOLD = 5,
  RESERVED_EXTENSION = 6,
  SOLD = 7,
  HOLD = 8,
  PARTIAL_DOWNPAYMENT = 9,
}

export enum ListingVisibilityID {
  STAFF = 1,
  STAFF_AFFILIATE = 2,
  AFFILIATE = 3,
}

export enum ListingAllocationID {
  OPEN = 1,
  CLOSED = 2,
  INVESTOR_QUOTA = 3,
}

export enum ListingCommissionType {
  PERCENTAGE = "percentage",
  VALUE = "value",
}

class Listing extends Model {
  public id!: number;
  public statusID!: ListingStatusID;

  public againstType!: ListingAgainstType;
  public againstID!: number;

  public agencyID!: number | null;

  public unitNumber!: string | null;
  public addressID!: number | null;
  public purposeID!: PurposeID | null;
  public categoryID!: number | null;

  public price!: number | null;
  public maxDiscountPercentage!: number | null;

  public bedroomCount!: number | null;
  public bathroomCount!: number | null;
  public areaCovered!: number | null;
  public areaFree!: number | null;
  public areaTotal!: number | null;
  public areaUnitID!: AreaUnitID | null;

  public allocationID!: ListingAllocationID;
  public visibilityID!: ListingVisibilityID;

  public commissionType!: ListingCommissionType | null;
  public commissionValue!: number | null;

  public url!: string | null;

  public createdAt!: Date;
  public updatedAt!: Date;

  public Address!: Address | null;
  public ListingImages!: ListingImage[];

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "listing_id",
        },
        statusID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "status",
        },
        againstType: {
          type: DataTypes.ENUM,
          allowNull: false,
          values: Object.values(ListingAgainstType),
          field: "listing_against",
        },
        againstID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "listing_against_id",
        },
        agencyID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "agency_id",
        },
        unitNumber: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "unit_number",
        },
        addressID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "address_id",
        },
        purposeID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "purpose_id",
        },
        categoryID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "type_id",
        },
        price: {
          type: DataTypes.DOUBLE,
          allowNull: true,
        },
        maxDiscountPercentage: {
          type: DataTypes.FLOAT,
          allowNull: true,
          field: "max_discount",
        },
        bedroomCount: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "bed",
        },
        bathroomCount: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "bath",
        },
        areaCovered: {
          type: DataTypes.FLOAT,
          allowNull: true,
          field: "covered_area",
        },
        areaFree: {
          type: DataTypes.FLOAT,
          allowNull: true,
          field: "land_area",
        },
        areaTotal: {
          type: DataTypes.FLOAT,
          allowNull: true,
          field: "gross_area",
        },
        areaUnitID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "area_unit_id",
        },
        allocationID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "allocation",
        },
        visibilityID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "visibility",
        },
        commissionType: {
          type: DataTypes.ENUM,
          allowNull: true,
          values: Object.values(ListingCommissionType),
          field: "commission_type",
        },
        commissionValue: {
          type: DataTypes.FLOAT,
          allowNull: true,
          field: "commission_value",
        },
        url: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "external_url",
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
        tableName: "zn_pf_listings",
      }
    );
  }
}

export default Listing;
