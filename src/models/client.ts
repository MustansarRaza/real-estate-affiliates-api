import { SourcePlatform } from "@pf/taxonomies";
import { DataTypes, Model, Sequelize } from "sequelize";
import ClientPhoneNumber from "./clientPhoneNumber";

export enum ClientStatusID {
  ACTIVE = 0,
  DELETED = 1,
}

export enum ClientAccessID {
  UNKNOWN = 0,
  PRIVATE = 1,
  PUBLIC = 2,
}

export enum ClientTypeID {
  DIRECT = 1,
  AGENT = 2,
  INVESTOR = 4,
  INVESTMENT_FUND = 5,
  OTHER = 3,
}

export enum ClientReferralType {
  DIRECT = "direct",
  AFFILIATE = "affiliate",
}

class Client extends Model {
  public id!: number;
  public statusID!: ClientStatusID;
  public typeID!: ClientTypeID | null;
  public accessID!: ClientAccessID | null;
  public userID!: number | null;
  public agencyID!: number;
  public name!: string;
  public email!: string | null;
  public address!: string | null;
  public countryID!: number | null;
  public locationID!: number | null;
  public phoneNumber!: string | null;
  public comment!: string | null;
  public referralType!: ClientReferralType | null;
  public referralID!: number | null;
  public source!: SourcePlatform;
  public createdAt!: Date;
  public updatedAt!: Date;

  public ClientPhoneNumbers!: ClientPhoneNumber[];

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "clientid",
        },
        name: {
          type: new DataTypes.STRING(255),
          allowNull: false,
        },
        statusID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "client_status",
        },
        typeID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "client_user_type",
        },
        // This field is an FK to zn_client_accesses
        // which has two rows: Public (1), Private (2)
        // Yet the affiliates web app sets the value to 0 by default
        // We do the same for compatibility
        accessID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "client_type",
          defaultValue: ClientAccessID.UNKNOWN,
        },
        userID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "client_userid",
        },
        agencyID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "client_agency",
        },
        email: {
          type: new DataTypes.STRING(255),
          allowNull: true,
          unique: true,
        },
        address: {
          type: new DataTypes.STRING(255),
          allowNull: true,
        },
        countryID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "country",
        },
        locationID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "city_id",
        },
        phoneNumber: {
          type: new DataTypes.STRING(45),
          allowNull: true,
          field: "phone",
        },
        comment: {
          type: DataTypes.TEXT,
          allowNull: true,
          field: "comments",
        },
        referralType: {
          type: DataTypes.ENUM,
          values: Object.values(ClientReferralType),
          allowNull: true,
          defaultValue: ClientReferralType.DIRECT,
          field: "refferal_type",
        },
        referralID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "refferal_id",
        },
        source: {
          type: DataTypes.ENUM,
          values: Object.values(SourcePlatform),
          allowNull: false,
          defaultValue: SourcePlatform.PROPFORCE,
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
      },
      { sequelize, tableName: "zn_clients" }
    );
  }
}

export default Client;
