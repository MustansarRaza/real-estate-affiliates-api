import { AffiliateAppSourceType } from "@pf/taxonomies";
import { AppError, ErrorTypes } from "@pf/utils";
import {
  Affiliate,
  AffiliateContact,
  AffiliateContactCell,
  AffiliatePlatform,
  affiliatePlatformToID,
  AffiliateType,
  affiliateTypeFromID,
  affiliateTypeToID,
  Agent,
  Contact,
  GovIDType,
  PotentialAffiliate,
  PotentialAffiliateDeviceData,
  PotentialAffiliateStatus,
  PotentialAffiliateVerificationStatusID,
  sequelizeNamespace,
} from "affiliates-api/models";
import { ErrorMessages, FORMAT_DATE } from "affiliates-api/services/constants";
import { isInternalTestEmailAddress } from "affiliates-api/tools";
import { format } from "date-fns";
import { INTERNAL_SERVER_ERROR } from "http-status-codes";
import { startCase } from "lodash";
import { Op, Sequelize, WhereOptions } from "sequelize";
import LocationsService from "./locations";

export interface ProfileDTO {
  email: string;
  username: string;
  givenName: string;
  familyName: string;
  mobilePhoneNumbers: string[];
  landLinePhoneNumbers: string[];
  address: string | null;
  govIDType: GovIDType | null;
  govIDNumber: string | null;
  taxNumber: string | null;
  businessName: string | null;
  affiliateType: AffiliateType | null;
  locationID: number | null;
  deviceType?: string;
  termsAndConditionsVersion: string | null;
}

export interface CreateProfileDTO {
  email: string;
  givenName: string;
  familyName: string;
  mobilePhoneNumbers: string[];
  landLinePhoneNumbers: string[];
  address: string;
  govIDType: GovIDType;
  govIDNumber: string;
  taxNumber: string | null;
  businessName: string | null;
  affiliateType: AffiliateType;
  locationID: number;
  platform?: AffiliatePlatform;
  source?: AffiliateAppSourceType;
  sourceReferralPhoneNumber?: string | null;
  sourceReferralName?: string | null;
  deviceData?: PotentialAffiliateDeviceData | null;
  termsAndConditionsVersion: string | null;
}

type BySSOIDLookup = {
  ssoID: string;
};

type ByUsernameLookup = {
  username: string;
};

type ByMobilePhoneNumbersLookup = {
  mobilePhoneNumbers: string[];
};

interface FindOptions {
  forUpdate?: boolean;
}

interface OtherServices {
  locations: LocationsService;
}

/**
 * Provides access to the user's profile.
 *
 * The user's profile is a mutable resource that contains the user's
 * basic contact information and things like the profile picture,
 * govermenent ID etc.
 */
class ProfileService {
  constructor(private services: OtherServices) {}
  /**
   * Gets a single profile matching the specified parameters.
   */
  async get(
    lookup: BySSOIDLookup | ByUsernameLookup | ByMobilePhoneNumbersLookup
  ): Promise<ProfileDTO> {
    const profile = await this.find(lookup);

    if (!profile) {
      throw new AppError(ErrorMessages.USER_AFFILIATE_ERROR_MESSAGE, {
        statusCode: 404,
      });
    }

    return profile;
  }

  /**
   * Finds a single profile matching one or more of the
   * specified parameters.
   */
  async find(
    lookup: BySSOIDLookup | ByUsernameLookup | ByMobilePhoneNumbersLookup,
    options?: FindOptions
  ): Promise<ProfileDTO | null> {
    const whereClause: WhereOptions = {};

    const { ssoID } = lookup as BySSOIDLookup;
    const { username } = lookup as ByUsernameLookup;
    const { mobilePhoneNumbers } = lookup as ByMobilePhoneNumbersLookup;

    if (ssoID) {
      whereClause.ssoID = { [Op.eq]: ssoID };
    }

    if (username) {
      // @ts-ignore
      if (!whereClause[Op.or]) {
        // @ts-ignore
        whereClause[Op.or] = [];
      }

      // @ts-ignore because it complains about [Op.or] as a key
      whereClause[Op.or].push(
        Sequelize.where(
          Sequelize.fn("JSON_EXTRACT", Sequelize.col("contact_data"), "$.email"),
          username
        )
      );
    }

    if (mobilePhoneNumbers) {
      // @ts-ignore
      if (!whereClause[Op.or]) {
        // @ts-ignore
        whereClause[Op.or] = [];
      }

      // @ts-ignore because it complains about [Op.or] as a key
      whereClause[Op.or].push(
        Sequelize.where(Sequelize.fn("JSON_EXTRACT", Sequelize.col("contact_data"), "$.mobile"), {
          [Op.in]: mobilePhoneNumbers,
        })
      );
    }

    const transaction = sequelizeNamespace.get("transaction");
    const shouldLockForUpdate = transaction && options?.forUpdate;

    const potentialAffiliate = await PotentialAffiliate.findOne({
      attributes: ["id", "contactData", "deviceData", "termsAndConditionsVersion"],
      where: whereClause,
      lock: shouldLockForUpdate ? transaction.LOCK.UPDATE : null,
    });

    if (!potentialAffiliate) {
      return null;
    }

    return this.serialize(potentialAffiliate);
  }

  /**
   * Creates a new profile for the specified SSO user.
   */
  async create({ ssoID }: BySSOIDLookup, dto: CreateProfileDTO): Promise<ProfileDTO> {
    const location = await this.services.locations.getWithHierarchy({ locationID: dto.locationID });

    if (!location || !location.level1Location) {
      throw new AppError(`Cannot find location`, {
        statusCode: 400,
        extra: {
          locationID: dto.locationID,
        },
      });
    }

    const isTest = isInternalTestEmailAddress(dto.email);

    // It could be that the registering user already is an
    // affiliate, but has never used the mobile app or webapp.
    // In this case, we match using the phone number and link
    // the potential affiliate record to to AffiliateContact
    // record ahead of time
    const contact = await AffiliateContact.findOne({
      attributes: ["affiliateContactID"],
      include: [
        {
          model: Contact,
          attributes: [],
          required: true,
          include: [
            {
              model: AffiliateContactCell,
              attributes: [],
              required: true,
              where: {
                mobilePhoneNumber: {
                  [Op.eq]: dto.mobilePhoneNumbers[0],
                },
              },
            },
          ],
        },
        {
          model: Affiliate,
          attributes: [],
          required: true,
          include: [
            {
              model: Agent,
              attributes: [],
              required: true,
              where: {
                isTest: {
                  [Op.eq]: isTest,
                },
              },
            },
          ],
        },
      ],
    });

    const affiliateContactID = contact?.affiliateContactID || null;
    const potentialAffiliate = await PotentialAffiliate.create({
      status: PotentialAffiliateStatus.UNVERIFIED,
      termsAndConditionsVersion: dto.termsAndConditionsVersion,
      verificationStatusID: PotentialAffiliateVerificationStatusID.NEW,
      ssoID,
      affiliateContactID: affiliateContactID,
      contactData: {
        name: `${dto.givenName} ${dto.familyName}`,
        email: dto.email,
        ntn: dto.taxNumber,
        city: location.name,
        cityId: location.id.toString(),
        idType: dto.govIDType,
        idNumber: dto.govIDNumber,
        phone: dto.landLinePhoneNumbers[0] || null,
        mobile: dto.mobilePhoneNumbers[0] || null,
        address: dto.address,
        firstName: dto.givenName,
        lastName: dto.familyName,
        country: location.level1Location.name,
        countryId: location.level1Location.id.toString(),
        businessName: dto.businessName,
        businessAdress: dto.address || null,
        affiliateType: affiliateTypeToID(dto.affiliateType),
        affiliateTypeTitle: startCase(dto.affiliateType),
        platformId: affiliatePlatformToID(dto.platform || AffiliatePlatform.MOBILE_APP),
        source: dto.source,
        sourceReferralName: dto.sourceReferralName || null,
        sourceReferralPhoneNumber: dto.sourceReferralPhoneNumber || null,
      },
      ...(dto.deviceData &&
        dto.deviceData.deviceType &&
        dto.deviceData.macAddress &&
        dto.deviceData.ipAddress &&
        dto.deviceData.osVersion && {
          deviceData: {
            dateAndTime: format(new Date(), FORMAT_DATE.FULL_DATE_24_HOUR_FORMAT_DATE_FNS),
            macAddress: dto.deviceData.macAddress,
            ipAddress: dto.deviceData.ipAddress,
            osVersion: dto.deviceData.osVersion,
            deviceType: dto.deviceData.deviceType,
          },
        }),
      isTest: isTest,
    });

    return this.serialize(potentialAffiliate);
  }

  private serialize(potentialAffiliate: PotentialAffiliate): ProfileDTO {
    if (!potentialAffiliate.contactData) {
      throw new AppError("Current user does not have contact data", {
        name: ErrorTypes.WrongSetup,
        statusCode: INTERNAL_SERVER_ERROR,
        extra: {
          potentialAffiliateID: potentialAffiliate.id,
        },
      });
    }

    const { contactData, deviceData, termsAndConditionsVersion } = potentialAffiliate;

    const {
      email,
      firstName,
      lastName,
      mobile,
      phone,
      address,
      idType,
      idNumber,
      ntn,
      businessName,
      affiliateType,
      cityId,
    } = contactData;

    if (!email || !firstName || !lastName) {
      throw new AppError("Current user is a broken affiliate", {
        name: ErrorTypes.WrongSetup,
        statusCode: INTERNAL_SERVER_ERROR,
        extra: {
          potentialAffiliateID: potentialAffiliate.id,
          contactDataType: typeof contactData,
        },
      });
    }

    const affiliateInfo: ProfileDTO = {
      email,
      // TODO: this is an assumption we make for now, in the future
      // we might use the phone number as a username
      username: email,
      givenName: firstName,
      familyName: lastName,
      mobilePhoneNumbers: mobile ? [mobile] : [],
      landLinePhoneNumbers: phone ? [phone] : [],
      address: address || null,
      govIDType: idType || null,
      govIDNumber: idNumber || null,
      taxNumber: ntn || null,
      businessName: businessName || null,
      affiliateType: affiliateTypeFromID(this.asNumber(affiliateType)),
      locationID: this.asNumber(cityId),
      termsAndConditionsVersion,
    };

    if (this.validateDeviceData(deviceData, potentialAffiliate.id))
      affiliateInfo.deviceType = deviceData?.deviceType;

    return affiliateInfo;
  }

  private asNumber(value?: string | null): number | null {
    if (!value) {
      return null;
    }

    const parsedNumber = parseInt(value, 10);
    if (Number.isNaN(parsedNumber)) {
      return null;
    }

    return parsedNumber;
  }

  private validateDeviceData(
    deviceData: PotentialAffiliateDeviceData | null,
    affiliateId: number
  ): boolean {
    if (deviceData) {
      const { deviceType, osVersion, ipAddress, macAddress } = deviceData;
      const missingAttributes: string[] = [];
      if (!deviceType) {
        missingAttributes.push("device_type");
      }
      if (!osVersion) {
        missingAttributes.push("os_version");
      }
      if (!ipAddress) {
        missingAttributes.push("ip_address");
      }
      if (!macAddress) {
        missingAttributes.push("mac_address");
      }
      if (missingAttributes.length > 0) {
        throw new AppError(`missing ${missingAttributes.join(", ")} in the passed Device Data`, {
          name: ErrorTypes.WrongSetup,
          statusCode: INTERNAL_SERVER_ERROR,
          extra: {
            potentialAffiliateID: affiliateId,
            brokenDeviceData: JSON.stringify(deviceData),
          },
        });
      }
      return true;
    }
    return false;
  }
}

export default ProfileService;
