import { AppError, ErrorTypes } from "@pf/utils";
import { config } from "affiliates-api/config";
import {
  Affiliate,
  AffiliateAssignee,
  AffiliateAssigneeType,
  AffiliateContact,
  AffiliateType,
  affiliateTypeToID,
  PotentialAffiliate,
  PotentialAffiliateStatus,
  PotentialAffiliateVerificationStatus,
  PotentialAffiliateVerificationStatusID,
  PotentialAffiliateVerificationStatusKey,
  sequelize,
  User,
} from "affiliates-api/models";
import { ErrorMessages } from "affiliates-api/services/constants";
import KeycloakClient from "keycloak-admin";
import { get, startCase } from "lodash";
import { Op } from "sequelize";
import LocationsService from "./locations";
import ProfileService, { CreateProfileDTO, ProfileDTO } from "./profile";

interface AffiliateDTO {
  id: number;
  agencyID: number;
  assignees: AffiliateAssigneeDTO[];
}

interface AffiliateVerificationDTO {
  id: number;
  status: string;
}

export interface MeDTO {
  ssoID: string;
  profile: ProfileDTO;
  status: PotentialAffiliateStatus;
  affiliateVerificationStatus: AffiliateVerificationDTO | null;
  affiliate: AffiliateDTO | null;
}

export interface CreateMeDTO {
  profile: CreateProfileDTO;
  credentials: {
    password: string;
  };
}

interface AffiliateAssigneeDTO {
  type: AffiliateAssigneeType;
  affiliateID: number;
  user: {
    id: number;
    name: string;
    email: string | null;
    mobilePhoneNumber: string | null;
    landLinePhoneNumber: string | null;
    hasWhatsApp: boolean;
  };
}

interface AffiliateOwnerDTO {
  affiliateID: number;
  agencyID: number;
  userID: number;
}

interface OtherServices {
  profile: ProfileService;
  locations: LocationsService;
}

interface BySSOIDLookup {
  ssoID: string;
}

interface ByAffiliateIDLookup {
  affiliateID: string;
}

/**
 * High-level service that describes the currently authenticated user.
 *
 * This is different from the user's profile. The user's profile is a
 * mutable resource that the user can edit and update. The MeService
 * describes users, including resources that the user cannot edit such
 * as the assignees and its current verification status.
 */
class MeService {
  constructor(private services: OtherServices) {}

  /**
   * Gets an overview describing the specified SSO user.
   *
   * This will return very little information if the SSO user has
   * not been verified and set up as an affiliate.
   */
  async get({ ssoID }: BySSOIDLookup): Promise<MeDTO> {
    const [potentialAffiliate, profile, assignees] = await Promise.all([
      PotentialAffiliate.findOne({
        attributes: ["status"],
        where: {
          ssoID: {
            [Op.eq]: ssoID,
          },
        },
        order: ["id"],
        include: [
          {
            model: AffiliateContact,
            required: false,
            attributes: ["affiliateID"],
            include: [
              {
                model: Affiliate,
                required: true,
                attributes: ["id", "agencyID"],
              },
            ],
          },
          {
            model: PotentialAffiliateVerificationStatus,
            required: false,
            attributes: ["id", "key"],
          },
        ],
      }),
      this.services.profile.get({ ssoID }),
      this.assignees({ ssoID }),
    ]);

    if (!profile || !potentialAffiliate) {
      throw new AppError(ErrorMessages.USER_AFFILIATE_ERROR_MESSAGE, {
        statusCode: 404,
        extra: {
          ssoID,
        },
      });
    }

    const {
      status,
      AffiliateContact: contact,
      PotentialAffiliateVerificationStatus: verificationStatus,
    } = potentialAffiliate;
    const { Affiliate: affiliate } = contact || {};

    const affiliateVerificationStatus = verificationStatus
      ? Object.assign({}, { id: verificationStatus.id, status: verificationStatus.key })
      : null;

    if (!affiliate) {
      return {
        ssoID,
        profile,
        status,
        affiliateVerificationStatus,
        affiliate: null,
      };
    }

    return {
      ssoID,
      profile,
      status,
      affiliateVerificationStatus,
      affiliate: {
        id: contact.Affiliate.id,
        agencyID: contact.Affiliate.agencyID,
        assignees: assignees,
      },
    };
  }

  /**
   * Creates a new user with a profile.
   */
  async create(dto: CreateMeDTO): Promise<MeDTO> {
    const keycloakClient = await this.createKeycloakClient();

    return await sequelize.transaction(async () => {
      const existingProfile = await this.services.profile.find(
        {
          username: dto.profile.email,
          mobilePhoneNumbers: dto.profile.mobilePhoneNumbers,
        },
        { forUpdate: true }
      );

      const existingKeycloakUsers = await keycloakClient.users.find({
        username: dto.profile.email,
      });

      // fallback scenario for when a previous create call failed after
      // creating the keycloak user, but before creating the profile
      if (existingKeycloakUsers[0]?.id && !existingProfile) {
        await keycloakClient.users.del({ id: existingKeycloakUsers[0]?.id });
      }

      if (existingProfile) {
        throw new AppError("User with this e-mail or phone number already exists", {
          statusCode: 409,
          extra: {
            email: dto.profile.email,
          },
        });
      }

      const location = await this.services.locations.getWithHierarchy({
        locationID: dto.profile.locationID,
      });
      if (!location || !location.level1Location) {
        throw new AppError(`Cannot find location`, {
          statusCode: 400,
          extra: {
            locationID: dto.profile.locationID,
          },
        });
      }

      try {
        const { id: ssoID } = await keycloakClient.users.create({
          username: dto.profile.email,
          email: dto.profile.email,
          firstName: dto.profile.givenName,
          lastName: dto.profile.familyName,
          credentials: [
            {
              type: "password",
              value: dto.credentials.password,
            },
          ],
          enabled: true,
          emailVerified: true,
          // for backwards compatibility with propforce.com
          attributes: {
            address: [dto.profile.address],
            businessName: dto.profile.businessName ? [dto.profile.businessName] : [],
            businessAddress:
              dto.profile.affiliateType !== AffiliateType.INDIVIDUAL ? [dto.profile.address] : [],
            affiliateType: [affiliateTypeToID(dto.profile.affiliateType)],
            affiliateTypeTitle: [startCase(dto.profile.affiliateType)],
            city: [location.id],
            country: [location.level1Location.id],
            govtId: [dto.profile.govIDType],
            landline: dto.profile.landLinePhoneNumbers,
            mobile: dto.profile.mobilePhoneNumbers,
            ntn: dto.profile.taxNumber,
            isProfileCompleted: ["yes"],
          },
        });

        const profile = await this.services.profile.create({ ssoID }, dto.profile);

        return {
          ssoID,
          profile,
          status: PotentialAffiliateStatus.UNVERIFIED,
          affiliateVerificationStatus: {
            id: PotentialAffiliateVerificationStatusID.NEW,
            status: PotentialAffiliateVerificationStatusKey.NEW,
          },
          affiliate: null,
        };
      } catch (error) {
        // this shouldn't happen because of the check we're doing earlier
        // on, but there's a small possibilty, a race condition essentially
        const isDuplicateUserError = error?.response?.status === 409;
        if (isDuplicateUserError) {
          throw new AppError("User with this e-mail or phone number already exists", {
            statusCode: 409,
            extra: {
              email: dto.profile.email,
            },
          });
        }

        throw error;
      }
    });
  }

  /**
   * Updates the user profile with the accepted version of Terms and Conditions
   */
  async acceptTermsAndConditions(ssoID: string, version: string): Promise<MeDTO> {
    await PotentialAffiliate.update(
      { termsAndConditionsVersion: version },
      { where: { ssoID: { [Op.eq]: ssoID } } }
    );
    return this.get({ ssoID });
  }
  /**
   * Gets a list of assignees for the specified affiliate.
   *
   * Assignees are employees who have been assigned to manage this
   * affiliate in a specific role. The role is indicated by the `type`
   * field. An affiliate is not completely signed up if it doesn't
   * have at least one affiliate.
   */
  async assignees({ ssoID }: BySSOIDLookup): Promise<AffiliateAssigneeDTO[]> {
    const assignees = await AffiliateAssignee.findAll({
      attributes: ["userID", "affiliateID", "type"],
      include: [
        {
          model: User,
          required: true,
        },
        {
          model: AffiliateContact,
          required: true,
          attributes: [],
          where: {
            ssoID: {
              [Op.eq]: ssoID,
            },
          },
        },
      ],
      order: [
        ["assignee_type", "ASC"],
        ["affiliate_assignee_id", "ASC"],
      ],
    });

    return assignees.map((assignee: any) => ({
      type: assignee.type,
      affiliateID: assignee.affiliateID,
      user: {
        id: assignee.User.id,
        name: assignee.User.name,
        email: assignee.User.email || null,
        mobilePhoneNumber: assignee.User.mobilePhoneNumber || null,
        landLinePhoneNumber: assignee.User.landLinePhoneNumber || null,
        hasWhatsApp: assignee.User.hasWhatsApp || false,
      },
    }));
  }

  /**
   * Gets data which describes who should own resources that
   * the specified affiliate creates.
   *
   * By default, this is the BDM assignee and its agency.
   */
  async owner({ ssoID }: BySSOIDLookup): Promise<AffiliateOwnerDTO | null> {
    const affiliate = await Affiliate.findOne({
      attributes: ["id", "agencyID"],
      include: [
        {
          model: AffiliateContact,
          required: true,
          attributes: [],
          where: {
            ssoID: {
              [Op.eq]: ssoID,
            },
          },
        },
        {
          model: AffiliateAssignee,
          required: true,
          attributes: ["userID"],
          where: {
            type: {
              [Op.in]: [AffiliateAssigneeType.BDM, AffiliateAssigneeType.TAAM],
            },
          },
          order: [["affiliate_assignee_id", "ASC"]],
        },
      ],
    });

    if (!affiliate) {
      return null;
    }

    const bdm = affiliate.AffiliateAssignees[0];
    if (!bdm) {
      return null;
    }

    return {
      affiliateID: affiliate.id,
      userID: bdm.userID,
      agencyID: affiliate.agencyID,
    };
  }

  /**
   * Creates a client that can be used to adminster
   * the Keycloak server.
   */
  private async createKeycloakClient(): Promise<KeycloakClient> {
    const { authServerURL, realm, clientID, clientSecret } = config.get("keycloak");

    const keycloakClient = new KeycloakClient({
      baseUrl: authServerURL,
      realmName: realm,
    });

    if (!clientSecret) {
      throw new AppError("Keycloak client secret is not configured", {
        name: ErrorTypes.WrongSetup,
        statusCode: 500,
        extra: {
          clientID,
        },
      });
    }

    await keycloakClient.auth({
      grantType: "client_credentials",
      clientId: clientID,
      // yes, we're speciying it twice, client is broken
      // and completely ignores the clientSecret property
      // but it works with the password property, specifying
      // both in case an upgrade makes it work
      // @ts-ignore
      password: clientSecret,
      // @ts-ignore
      clientSecret,
    });

    return keycloakClient;
  }

  /**
   *
   * Gets the type of affiliate corresponding
   * to specified ssoID
   */
  async type({ ssoID }: BySSOIDLookup): Promise<number | null> {
    const affiliate = await PotentialAffiliate.findOne({
      where: {
        ssoID: { [Op.eq]: ssoID },
      },
      include: [
        {
          model: AffiliateContact,
          required: true,
          attributes: ["affiliateID"],
          include: [
            {
              model: Affiliate,
              required: true,
              attributes: ["id", "typeID"],
            },
          ],
        },
      ],
    });

    return get(affiliate, "AffiliateContact.Affiliate.typeID", null);
  }
}

export default MeService;
