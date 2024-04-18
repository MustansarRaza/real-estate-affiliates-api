import { SourcePlatform } from "@pf/taxonomies";
import { DataTypes, Model, Sequelize } from "sequelize";
import Address from "./address";
import { LeadClassificationID } from "./leadClassification";
import LeadLocation from "./leadLocation";
import LeadStatus from "./leadStatus";
import { PurposeID } from "./purpose";
import Task from "./task";

export enum LeadState {
  ON = "on",
  DELETED = "deleted",
  // TODO: seems unused, but maybe not, this is the DB default
  PENDING = "pending",
}

export enum LeadSide {
  DEMAND = "demand",
  SUPPLY = "supply",
}

export enum LeadMarket {
  PRIMARY = "primary",
  SECONDARY = "secondary",
}

export enum LeadInquiryObjectType {
  LISTING = "listing",
  PROJECT = "project",
}

export enum LeadInquiryBudgetCurrency {
  EUR = "EUR",
  PKR = "PKR",
  USD = "USD",
}

class Lead extends Model {
  public id!: number;
  public state!: LeadState;
  public source!: SourcePlatform;
  public userID!: number;
  public clientID!: number;
  public agencyID!: number;
  public statusID!: number;
  public addressID!: number | null;
  public side!: LeadSide;
  public market!: LeadMarket;
  public classificationID!: LeadClassificationID;
  public tsrClassificationID!: LeadClassificationID;
  public inquiryObjectType!: LeadInquiryObjectType | null;
  public inquiryObjectID!: number | null;
  public inquiryPurposeID!: PurposeID | null;
  public inquiryCategoryID!: number | null;
  public inquiryBudgetAmount!: number | null;
  public inquiryBudgetCurrency!: LeadInquiryBudgetCurrency | null;
  public inquiryBedroomCount!: number | null;
  public inquiryBathroomCount!: number | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  public Address!: Address | null;
  public LeadStatus!: LeadStatus;
  public LastTaskPerformed!: Task | null;
  public LeadLocations!: LeadLocation[];

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "inquiry_id",
        },
        state: {
          type: DataTypes.ENUM,
          allowNull: false,
          values: Object.values(LeadState),
          field: "firmstate",
        },
        source: {
          type: DataTypes.ENUM,
          allowNull: false,
          values: Object.values(SourcePlatform),
        },
        userID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "userid",
        },
        clientID: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        agencyID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "agency_id",
        },
        statusID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "status",
        },
        side: {
          type: DataTypes.ENUM,
          allowNull: false,
          values: Object.values(LeadSide),
          field: "lead_side",
        },
        market: {
          type: DataTypes.ENUM,
          allowNull: false,
          values: Object.values(LeadMarket),
          field: "interested_in",
        },
        classificationID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "classification_id",
        },
        tsrClassificationID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "tsr_classification_id",
        },
        inquiryObjectType: {
          type: DataTypes.ENUM,
          allowNull: true,
          values: Object.values(LeadInquiryObjectType),
          field: "object_type",
        },
        inquiryObjectID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "object_id",
        },
        inquiryPurposeID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "purpose",
        },
        inquiryCategoryID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "type",
        },
        inquiryBudgetAmount: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "budget",
        },
        inquiryBudgetCurrency: {
          type: new DataTypes.STRING(3),
          allowNull: true,
          field: "currency",
        },
        inquiryBedroomCount: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "beds",
        },
        inquiryBathroomCount: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "baths",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "time_added",
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "time_updated",
        },
        addressID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "address_id",
        },
      },
      {
        sequelize,
        tableName: "zn_internal_inquiries",
      }
    );
  }
}

export default Lead;
