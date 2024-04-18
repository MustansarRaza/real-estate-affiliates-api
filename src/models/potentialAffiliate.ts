import { AffiliateAppSourceType } from "@pf/taxonomies";
import { DataTypes, Model, Sequelize } from "sequelize";
import { AffiliatePlatformID } from "./affiliatePlatform";

export enum PotentialAffiliateStatus {
  // has an account, but an incomplete profile, not approve-able
  REGISTERED = "registered",
  // complete profile, but not approved/verified yet
  UNVERIFIED = "unverified",
  // complete profile and approved and linked to an affiliate record
  VERIFIED = "verified",
}

export enum PotentialAffiliateVerificationStatusID {
  NEW = 1,
  REJECTED = 2,
  DONE = 3,
}

export enum PotentialAffiliateVerificationStatusKey {
  NEW = "new",
  REJECTED = "rejected",
  DONE = "done",
}

export enum GovIDType {
  NIC = "NIC",
  POC = "POC",
  CNIC = "CNIC",
  SNIC = "SNIC",
  NICOP = "NICOP",
  SNICOP = "SNICOP",
}

export type PotentialAffiliateContactData = Partial<{
  name: string;
  email: string;
  dob: string;
  ntn: string;
  city: string;
  cityId: string;
  gender: string;
  idType: GovIDType;
  idNumber: string;
  phone: string | null;
  mobile: string;
  address: string;
  language: string;
  firstName: string;
  lastName: string;
  country: string;
  countryId: string;
  ethnicity: string;
  designation: string;
  businessName: string;
  businessAddress: string | null;
  profession: number;
  customProfession: string;
  affiliateType: string;
  affiliateTypeTitle: string;
  platformId: AffiliatePlatformID;
  attachments: Partial<{
    govt_id: string;
    business_card: string;
    profile_image: string;
  }>;
  source: AffiliateAppSourceType;
  sourceReferralPhoneNumber: string | null;
  sourceReferralName: string | null;
}>;

export type PotentialAffiliateDeviceData = Partial<{
  dateAndTime?: string | null;
  macAddress: string;
  ipAddress: string;
  osVersion: string;
  deviceType: string;
}>;

class PotentialAffiliate extends Model {
  public id!: number;
  public status!: PotentialAffiliateStatus;
  public verificationStatusID!: PotentialAffiliateVerificationStatusID;
  public ssoID!: string;
  public affiliateContactID!: number | null;
  public contactData!: PotentialAffiliateContactData;
  public deviceData!: PotentialAffiliateDeviceData | null;
  public isTest!: boolean;
  public termsAndConditionsVersion!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        status: {
          type: DataTypes.ENUM,
          allowNull: false,
          values: Object.values(PotentialAffiliateStatus),
          defaultValue: PotentialAffiliateStatus.REGISTERED,
        },
        verificationStatusID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: PotentialAffiliateVerificationStatusID.NEW,
          field: "potential_affiliate_verification_status_id",
        },
        ssoID: {
          type: new DataTypes.STRING(36),
          allowNull: false,
          unique: true,
          field: "sso_id",
        },
        affiliateContactID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "affiliate_working_contact_id",
        },
        contactData: {
          type: DataTypes.JSON,
          allowNull: true,
          field: "contact_data",
        },
        deviceData: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: null,
          field: "device_data",
        },
        isTest: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          field: "is_test",
        },
        termsAndConditionsVersion: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "terms_and_conditions_version",
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
        tableName: "zn_pf_potential_affiliates",
      }
    );
  }
}

export default PotentialAffiliate;
