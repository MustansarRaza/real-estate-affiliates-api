import { AffiliateCommissionType, SourcePlatform } from "@pf/taxonomies";
import {
  AffiliateCommission,
  Client,
  ClientPhoneNumber,
  ClientReferralType,
  ClientStatusID,
  ClientTypeID,
  Lead,
  LeadClassificationID,
  LeadMarket,
  LeadSide,
  LeadState,
  Listing,
  ListingAgainstType,
  ListingAllocationID,
  ListingImage,
  ListingImageCategory,
  ListingReservation,
  ListingStatusID,
  ListingVisibilityID,
  MediaBankImage,
  PotentialAffiliate,
  PotentialAffiliateStatus,
  Project,
  ProjectAffiliateVisibilityID,
  ProjectImage,
  ProjectStatus,
} from "affiliates-api/models";

export enum ModelFixtureNames {
  ADDRESSES = "addresses",
  AFFILIATES = "affiliates",
  AFFILIATE_CONTACTS = "affiliateContacts",
  AGENCY_CONFIGURATION = "agencyConfiguration",
  AGENTS = "agents",
  CONTACTS = "contacts",
  DESIGNATIONS = "designations",
  AFFILIATE_ASSIGNEES = "affiliateAssignees",
  POTENTIAL_AFFILIATES = "potentialAffiliates",
  POTENTIAL_AFFILIATE_VERIFICATION_STATUS = "potentialAffiliateVerificationStatus",
  CATEGORIES = "categories",
  LOCATIONS = "locations",
  PROJECTS = "projects",
  PROJECT_IMAGES = "projectImages",
  TASK_TYPES = "taskTypes",
  TASKS = "tasks",
  USERS = "users",
  LEADS = "leads",
  LEAD_SOURCE = "leadSource",
  LEAD_LOCATIONS = "leadLocations",
  LEAD_STATUSES = "leadStatuses",
  CLIENTS = "clients",
  CLIENT_PHONE_NUMBERS = "clientPhoneNumbers",
  COUNTRIES = "countries",
  LISTINGS = "listings",
  LISTING_IMAGES = "listingImages",
  MEDIA_BANK_IMAGES = "mediaBankImages",
  LISTING_STATUSES = "listingStatuses",
  AFFILIATE_COMMISSION = "affiliateCommission",
  AFFILIATE_COMMISSION_PROPERTY_TYPE = "affiliateCommissionPropertyType",
  CONTRACTS = "contracts",
  CONTRACT_LISTINGS = "contractListings",
  CONTRACT_STATUSES = "contractStatuses",
  APP_RELEASE = "appRelease",
  PLATFORM = "platforms",
}

export const ModelFixtureConstants = Object.freeze({
  verifiedAffiliateID: 1,
  verifiedAffiliateAgencyID: 1337,
  verifiedSSOID: "4255c2ae-3f11-4a26-a401-3981c8845df3",
  unverifiedSSOID: "b8d3b78f-d7c0-45f9-be04-1e168ae959d3",
  nonExistantSSOID: "01010101-0101-0101-0101-010101010101",
  lahoreLocationID: 3,
  staffUserBDMID: 1,
  staffUserCoordinatorID: 2,
  activeAffiliateClientID: 1,
  leadStatusNewID: 1,
  affiliateLeadSourceId: 1,
});

export const createPotentialAffiliate = async (
  ssoID: string,
  fields: {} = {}
): Promise<PotentialAffiliate> =>
  await PotentialAffiliate.create({
    status: PotentialAffiliateStatus.VERIFIED,
    ssoID,
    affiliateContactID: null,
    contactData: null,
    deviceData: null,
    isTest: false,
    ...fields,
  });

export const createClient = async (fields: {} = {}): Promise<Client> =>
  await Client.create({
    agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
    statusID: ClientStatusID.ACTIVE,
    typeID: ClientTypeID.DIRECT,
    name: "test",
    referralType: ClientReferralType.AFFILIATE,
    referralID: 1,
    source: SourcePlatform.AFFILIATES_MOBILE_APP,
    userID: ModelFixtureConstants.staffUserBDMID,
    ...fields,
  });

export const createClientPhoneNumber = async (
  clientID: number,
  fields: {} = {}
): Promise<ClientPhoneNumber> =>
  await ClientPhoneNumber.create({
    clientID,
    ...fields,
  });

export const createProject = async (id: number, fields: {} = {}): Promise<Project> =>
  await Project.create({
    externalID: id,
    slug: `myproject-${id}`,
    name: `My Project ${id}`,
    status: ProjectStatus.ON,
    agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
    affiliateVisibility: ProjectAffiliateVisibilityID.VISIBLE,
    ...fields,
  });

export const createProjectImage = async (projectID: number, fields: {} = {}): Promise<Project> =>
  await ProjectImage.create({
    projectID,
    title: "my image",
    baseURL: "https://images.someserver.com",
    path: "myimage.jpg",
    ...fields,
  });

export const createListing = async (fields: {} = {}): Promise<Listing> =>
  await Listing.create({
    againstType: ListingAgainstType.PROJECT,
    againstID: 1,
    statusID: ListingStatusID.AVAILABLE,
    allocationID: ListingAllocationID.OPEN,
    visibilityID: ListingVisibilityID.AFFILIATE,
    agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
    ...fields,
  });

export const createAffiliateCommission = async (fields: {} = {}): Promise<AffiliateCommission> =>
  await AffiliateCommission.create({
    projectID: 1,
    affiliateTypeId: 1,
    propertyTypeId: 1,
    createdBy: 483,
    commissionType: AffiliateCommissionType.DISCOUNT_MODEL,
    downPayment: 30,
    commission: 2.5,
    ...fields,
  });

export const createListingImage = async (
  listingID: number,
  mediaBankImageID: number | null,
  fields: {} = {}
): Promise<ListingImage> =>
  await ListingImage.create({
    listingID,
    mediaBankImageID,
    category: ListingImageCategory.PHOTO,
    displayOrder: null,
    isDeleted: false,
    ...fields,
  });

export const createMediaBankImage = async (fields: {} = {}): Promise<MediaBankImage> =>
  await MediaBankImage.create({
    fileName: "image.jpg",
    key: "image.jpg",
    ...fields,
  });

export const createLead = async (
  userID: number,
  clientID: number,
  fields: {} = {}
): Promise<Lead> =>
  await Lead.create({
    state: LeadState.ON,
    source: SourcePlatform.AFFILIATES_WEB_APP,
    userID,
    clientID,
    agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
    statusID: 1,
    side: LeadSide.DEMAND,
    market: LeadMarket.PRIMARY,
    classificationID: LeadClassificationID.MODERATE,
    ...fields,
  });

export const createReservation = async (
  listingID: number,
  leadID: number,
  fields: {} = {}
): Promise<ListingReservation> =>
  await ListingReservation.create({
    listingID,
    leadID,
    reservedFor: ModelFixtureConstants.staffUserBDMID,
    reservedBy: ModelFixtureConstants.verifiedAffiliateID,
    status: "pending",
    source: "affiliates-mobile-app",
    comments: "test",
    ...fields,
  });
