import { config } from "affiliates-api/config";
import { getDbTimezone } from "affiliates-api/features";
import cls from "cls-hooked";
import { Sequelize } from "sequelize";
import Address from "./address";
import Affiliate from "./affiliate";
import AffiliateAssignee, { AffiliateAssigneeType } from "./affiliateAssignee";
import AffiliateCommission from "./affiliateCommission";
import AffiliateCommissionPropertyType from "./affiliateCommissionPropertyType";
import AffiliateContact from "./affiliateContact";
import AffiliateContactCell from "./affiliateContactCell";
import { AffiliatePlatform, AffiliatePlatformID, affiliatePlatformToID } from "./affiliatePlatform";
import AffiliateStatus, { AffiliateStatusKey } from "./affiliateStatus";
import {
  AffiliateType,
  affiliateTypeFromID,
  AffiliateTypeID,
  affiliateTypeToID,
} from "./affiliateType";
import AgencyConfiguration from "./agencyConfiguration";
import Agent from "./agent";
import AppRelease from "./appRelease";
import { AreaUnit, areaUnitFromID, AreaUnitID } from "./areaUnit";
import Category, {
  PopularCategoryIndex,
  PopularCategoryKey,
  popularCategoryKeyToIndex,
} from "./category";
import Client, { ClientAccessID, ClientReferralType, ClientStatusID, ClientTypeID } from "./client";
import ClientPhoneNumber from "./clientPhoneNumber";
import Contact from "./contact";
import Contract from "./contract";
import ContractListing from "./contractListing";
import ContractStatus from "./contractStatus";
import Country from "./country";
import Designation from "./designation";
import Lead, {
  LeadInquiryBudgetCurrency,
  LeadInquiryObjectType,
  LeadMarket,
  LeadSide,
  LeadState,
} from "./lead";
import {
  LeadClassification,
  leadClassificationFromID,
  LeadClassificationID,
  leadClassificationToID,
} from "./leadClassification";
import LeadLocation, { LeadLocationType } from "./leadLocation";
import LeadSource, { LeadSourceKey } from "./leadSource";
import LeadSourceMapping from "./leadSourceMapping";
import LeadStatus from "./leadStatus";
import Listing, {
  ListingAgainstType,
  ListingAllocationID,
  ListingCommissionType,
  ListingStatusID,
  ListingVisibilityID,
} from "./listing";
import ListingImage, { ListingImageCategory } from "./listingImage";
import ListingReservation from "./listingReservation";
import ListingStatus from "./listingStatus";
import Location, { LocationLevel, LocationLevelTitle, LocationPopularityIndex } from "./location";
import MediaBankImage from "./mediaBankImage";
import Platform from "./platform";
import PotentialAffiliate, {
  GovIDType,
  PotentialAffiliateContactData as PotentialAffiliateContactDataType,
  PotentialAffiliateDeviceData as PotentialAffiliateDeviceDataType,
  PotentialAffiliateStatus,
  PotentialAffiliateVerificationStatusID,
  PotentialAffiliateVerificationStatusKey,
} from "./potentialAffiliate";
import PotentialAffiliateVerificationStatus from "./potentialAffiliateVerificationStatus";
import Project, { ProjectAffiliateVisibilityID, ProjectStatus } from "./project";
import ProjectImage from "./projectImage";
import { Purpose, purposeFromID, PurposeID, purposeToID } from "./purpose";
import Task, { TaskAgainstType, TaskStageID, TaskStatus } from "./task";
import TaskType from "./taskType";
import User from "./user";

const sequelizeNamespace = cls.createNamespace("affiliates-api");
Sequelize.useCLS(sequelizeNamespace);

// @ts-ignore because typings don't include `operatorsAliases`
const sequelize = new Sequelize(config.get("db").url, {
  operatorsAliases: 0,
  logging: false,
  timezone: getDbTimezone(),
});

Address.setup(sequelize);
Affiliate.setup(sequelize);
AffiliateStatus.setup(sequelize);
AffiliateAssignee.setup(sequelize);
AffiliateContact.setup(sequelize);
AffiliateContactCell.setup(sequelize);
AgencyConfiguration.setup(sequelize);
AffiliateCommission.setup(sequelize);
AffiliateCommissionPropertyType.setup(sequelize);
Agent.setup(sequelize);
Category.setup(sequelize);
Contact.setup(sequelize);
Client.setup(sequelize);
ClientPhoneNumber.setup(sequelize);
Country.setup(sequelize);
Contract.setup(sequelize);
ContractListing.setup(sequelize);
ContractStatus.setup(sequelize);
Designation.setup(sequelize);
Lead.setup(sequelize);
LeadLocation.setup(sequelize);
LeadStatus.setup(sequelize);
LeadSource.setup(sequelize);
LeadSourceMapping.setup(sequelize);
Listing.setup(sequelize);
ListingStatus.setup(sequelize);
ListingImage.setup(sequelize);
MediaBankImage.setup(sequelize);
Location.setup(sequelize);
PotentialAffiliate.setup(sequelize);
PotentialAffiliateVerificationStatus.setup(sequelize);
Project.setup(sequelize);
ProjectImage.setup(sequelize);
Task.setup(sequelize);
TaskType.setup(sequelize);
User.setup(sequelize);
ListingReservation.setup(sequelize);
AppRelease.setup(sequelize);
Platform.setup(sequelize);

AffiliateCommission.belongsTo(AffiliateCommissionPropertyType, { foreignKey: "propertyTypeId" });

AffiliateStatus.hasMany(Affiliate, {
  sourceKey: "id",
  foreignKey: "affiliateStatus",
});
Address.hasMany(Project, {
  foreignKey: "addressID",
  sourceKey: "id",
});
Address.belongsTo(Location, { foreignKey: "cityLocationID" });

AffiliateAssignee.hasOne(User, { sourceKey: "userID", foreignKey: "id", constraints: false });
AffiliateAssignee.hasOne(Affiliate, {
  sourceKey: "affiliateID",
  foreignKey: "id",
  constraints: false,
});

Affiliate.hasOne(AffiliateContact, { sourceKey: "id", foreignKey: "affiliateID" });
Affiliate.hasMany(AffiliateAssignee, {
  sourceKey: "id",
  foreignKey: "affiliateID",
});
Affiliate.hasOne(AffiliateStatus, {
  sourceKey: "affiliateStatus",
  foreignKey: "id",
  constraints: false,
});

AffiliateContact.belongsTo(Affiliate, { foreignKey: "affiliateID" });

AffiliateContact.belongsTo(Contact, { foreignKey: "contactID", constraints: false });

Contact.hasOne(AffiliateContactCell, { foreignKey: "contactID" });

AffiliateAssignee.belongsTo(AffiliateContact, { foreignKey: "affiliateID" });

Affiliate.belongsTo(Client, { foreignKey: "referralID" });
Affiliate.belongsTo(Agent, { foreignKey: "agencyID" });

Client.hasOne(AffiliateContact, { sourceKey: "referralID", foreignKey: "affiliateID" });
AffiliateContact.belongsTo(Client, { foreignKey: "referralID" });

Client.hasMany(ClientPhoneNumber, { foreignKey: "clientID" });

Client.belongsTo(Location, {
  foreignKey: {
    name: "locationID",
    allowNull: true,
  },
});

Client.belongsTo(Country, {
  foreignKey: {
    name: "countryID",
    allowNull: true,
  },
});

Category.hasMany(Listing, {
  foreignKey: { name: "categoryID", allowNull: true },
  sourceKey: "id",
});

ContractListing.belongsTo(Contract, { foreignKey: "contractId" });

Contract.belongsTo(ContractStatus, { foreignKey: "status" });

PotentialAffiliate.hasOne(AffiliateContact, {
  sourceKey: "affiliateContactID",
  foreignKey: {
    name: "affiliateContactID",
    allowNull: true,
  },
  constraints: false,
});

PotentialAffiliate.belongsTo(PotentialAffiliateVerificationStatus, {
  foreignKey: "verificationStatusID",
});

Lead.belongsTo(Category, {
  foreignKey: {
    name: "inquiryCategoryID",
    allowNull: true,
  },
});

Lead.belongsTo(User, { foreignKey: "userID" });
Lead.belongsTo(LeadStatus, { foreignKey: "statusID" });
Lead.belongsTo(Client, { foreignKey: "clientID" });
Lead.belongsTo(Address, {
  foreignKey: {
    name: "addressID",
    allowNull: true,
  },
});

Lead.hasMany(LeadLocation, { foreignKey: "leadID" });

Lead.hasOne(Task, {
  foreignKey: "againstID",
  sourceKey: "id",
  as: "LastTaskPerformed",
});

LeadLocation.belongsTo(Location, { foreignKey: "locationID" });

Task.belongsTo(User, { foreignKey: "addedByUserID", as: "AddedByUser" });
Task.belongsTo(User, { foreignKey: "assignedToUserID", as: "AssignedToUser" });

Task.belongsTo(TaskType, { foreignKey: "typeID" });
TaskType.belongsTo(TaskType, { foreignKey: "parentID", as: "ParentTaskType" });

Project.hasMany(ProjectImage, { foreignKey: "projectID" });

Project.hasMany(Listing, {
  foreignKey: "againstID",
  sourceKey: "id",
  scope: { againstType: "project" },
});

Project.belongsTo(Address, { foreignKey: "addressID", targetKey: "id" });

Listing.belongsTo(Project, { foreignKey: "againstID", targetKey: "id" });

Listing.belongsTo(ListingStatus, {
  foreignKey: "statusID",
});

Listing.belongsTo(Category, { foreignKey: "categoryID" });

Listing.belongsTo(Address, {
  foreignKey: {
    name: "addressID",
    allowNull: true,
  },
});

Listing.hasMany(ContractListing, {
  foreignKey: "objectId",
  scope: { objectType: "listing" },
});

Location.belongsTo(Country, {
  foreignKey: {
    name: "countryID",
    allowNull: true,
  },
});

Location.belongsTo(Location, {
  foreignKey: {
    name: "level1LocationID",
    allowNull: true,
  },
  as: "Level1Location",
});

Listing.hasMany(ListingImage, { foreignKey: "listingID" });

ListingImage.belongsTo(MediaBankImage, {
  foreignKey: "mediaBankImageID",
});
ListingReservation.belongsTo(Affiliate, {
  foreignKey: "reservedBy",
  as: "ReservedByAffiliate",
});
ListingReservation.belongsTo(User, {
  foreignKey: "reservedBy",
  as: "ReservedBy",
});
ListingReservation.belongsTo(User, { foreignKey: "reservedFor", as: "ReservedFor" });
ListingReservation.belongsTo(User, { foreignKey: "updatedBy", as: "UpdatedBy" });
ListingReservation.belongsTo(Lead, { foreignKey: "leadID" });
ListingReservation.belongsTo(Listing, { foreignKey: "listingID" });

export type PotentialAffiliateContactData = PotentialAffiliateContactDataType;
export type PotentialAffiliateDeviceData = PotentialAffiliateDeviceDataType;

export {
  sequelize,
  sequelizeNamespace,
  Address,
  Affiliate,
  AffiliatePlatform,
  AffiliatePlatformID,
  affiliatePlatformToID,
  AffiliateStatus,
  AffiliateStatusKey,
  AffiliateAssignee,
  AffiliateAssigneeType,
  AffiliateCommission,
  AffiliateCommissionPropertyType,
  AffiliateContact,
  AffiliateContactCell,
  AgencyConfiguration,
  AffiliateType,
  AffiliateTypeID,
  affiliateTypeFromID,
  affiliateTypeToID,
  Agent,
  AreaUnit,
  AreaUnitID,
  AppRelease,
  areaUnitFromID,
  Category,
  Contact,
  Client,
  ClientStatusID,
  ClientTypeID,
  ClientAccessID,
  ClientReferralType,
  ClientPhoneNumber,
  Country,
  Contract,
  ContractListing,
  Designation,
  Location,
  Lead,
  LeadState,
  LeadSide,
  LeadMarket,
  LeadInquiryObjectType,
  LeadInquiryBudgetCurrency,
  LeadLocation,
  LeadSource,
  LeadSourceKey,
  LeadSourceMapping,
  LeadLocationType,
  LeadClassification,
  LeadClassificationID,
  leadClassificationFromID,
  leadClassificationToID,
  LeadStatus,
  Listing,
  ListingAgainstType,
  ListingStatusID,
  ListingVisibilityID,
  ListingAllocationID,
  ListingCommissionType,
  ListingImage,
  ListingImageCategory,
  MediaBankImage,
  PotentialAffiliate,
  PotentialAffiliateVerificationStatus,
  PotentialAffiliateStatus,
  PotentialAffiliateVerificationStatusID,
  PotentialAffiliateVerificationStatusKey,
  GovIDType,
  Project,
  ProjectStatus,
  ProjectAffiliateVisibilityID,
  ProjectImage,
  Purpose,
  PurposeID,
  purposeFromID,
  purposeToID,
  Task,
  TaskStatus,
  TaskStageID,
  TaskAgainstType,
  TaskType,
  User,
  ListingReservation,
  LocationPopularityIndex,
  LocationLevel,
  LocationLevelTitle,
  ListingStatus,
  PopularCategoryKey,
  PopularCategoryIndex,
  popularCategoryKeyToIndex,
  ContractStatus,
  Platform,
};
