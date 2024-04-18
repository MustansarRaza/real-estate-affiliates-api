import { SourcePlatform } from "@pf/taxonomies";
import { AppError } from "@pf/utils";
import {
  AffiliateContact,
  Client,
  ClientPhoneNumber,
  ClientReferralType,
  ClientStatusID,
} from "affiliates-api/models";
import { ISO8601DateTime } from "affiliates-api/types";
import { parsePhoneNumberFromString, PhoneNumber } from "libphonenumber-js";
import { Op, Sequelize, WhereOptions } from "sequelize";
import LocationsService from "./locations";
import MeService from "./me";

export interface ClientPhoneNumberDTO {
  id: number;
  value: string;
}

export interface ClientDTO {
  id: number;
  name: string;
  email: string | null;
  phoneNumbers: ClientPhoneNumberDTO[];
  address: string | null;
  locationID: number | null;
  comment: string | null;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

export interface CreateClientPhoneNumberDTO {
  value: string;
}

export interface CreateClientDTO {
  name: string;
  email: string;
  phoneNumbers: CreateClientPhoneNumberDTO[];
  address: string | null;
  locationID: number | null;
  comment: string | null;
  source?: SourcePlatform;
}

interface OtherServices {
  me: MeService;
  locations: LocationsService;
}

interface BySSOIDLookup {
  ssoID: string;
}

type ByNamePhoneNumberOrEmailLookup = RequireAtLeastOne<{
  name?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
}>;

/**
 * Provides access to clients.
 *
 * Clients are essentially contacts. They represent a person which can
 * be assigned to one or more leads.
 */
class ClientsService {
  constructor(private services: OtherServices) {}

  /**
   * Gets a flat list of clients for the specified potential
   * affiliate.
   */
  async list({ ssoID }: BySSOIDLookup): Promise<ClientDTO[]> {
    const clients = await Client.findAll({
      where: {
        statusID: {
          [Op.eq]: ClientStatusID.ACTIVE,
        },
        referralType: {
          [Op.eq]: ClientReferralType.AFFILIATE,
        },
      },
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
          model: ClientPhoneNumber,
          separate: true,
          order: [["cc_id", "ASC"]],
        },
      ],
      order: [
        ["time_added", "DESC"],
        ["clientid", "DESC"],
      ],
    });

    return clients.map((client: Client) => this.serialize(client));
  }

  /**
   * Gets an existing client by name, phone number or email.
   *
   * This is used to stop users from creating a client that another user
   * already has. This is _not_ to be used to avoid inserting duplicate
   * records. This is NOT CONCURRENCY SAFE.
   */
  async find({ email, phoneNumber }: ByNamePhoneNumberOrEmailLookup): Promise<ClientDTO | null> {
    const filters: WhereOptions[] = [];
    const phoneNumberFilters: WhereOptions[] = [];

    // e-mail addresses are not case sensitive so we lower-case on both
    // ends to simulate a case-insensitive search.. we can't use ILIKE
    // because its not supported by older MySQL versions or SQLite
    if (email) {
      const sanitizedEmail = email.toLowerCase().trim();
      filters.push(Sequelize.where(Sequelize.fn("lower", Sequelize.col("email")), sanitizedEmail));
    }

    if (phoneNumber) {
      const sanitizedPhoneNumber = this.sanitizePhoneNumber(phoneNumber);

      phoneNumberFilters.push({
        value: {
          [Op.eq]: sanitizedPhoneNumber,
        },
      });
    }

    const phoneNumbers = await ClientPhoneNumber.findAll({
      where: {
        [Op.or]: phoneNumberFilters,
      },
    });

    if (phoneNumbers) {
      filters.push({
        id: {
          [Op.in]: phoneNumbers.map((entry: ClientPhoneNumber) => entry.clientID),
        },
      });
    }

    const client = await Client.findOne({
      where: {
        [Op.or]: filters,
      },
      include: [
        {
          model: ClientPhoneNumber,
          order: [["cc_id", "ASC"]],
          separate: true,
        },
      ],
    });

    if (!client) {
      return null;
    }

    return this.serialize(client);
  }

  /**
   * Creates a new client that is owned by the specified {@paramref owner}.
   *
   * This will only work if the owner is a verified affiliate and will
   * fail with {@see AppError} if its not.
   */
  async create({ ssoID }: BySSOIDLookup, dto: CreateClientDTO): Promise<ClientDTO> {
    const { name, email, address, locationID, comment, phoneNumbers, source } = dto;

    const [owner, countryID] = await Promise.all([
      this.services.me.owner({ ssoID }),
      // lookup countryID because countries are included
      // in the location tree, we don't expose countryID to
      // the outside world, but we need to set it
      // for backwards compatibility reasons
      locationID ? this.services.locations.countryID({ locationID }) : Promise.resolve(null),
    ]);

    if (!owner) {
      throw new AppError("Current user has no owner", {
        statusCode: 400,
        extra: {
          ssoID,
        },
      });
    }

    if (locationID && !countryID) {
      throw new AppError("Cannot find location or location's country", {
        statusCode: 400,
        extra: {
          locationID,
        },
      });
    }

    // setting this for backwards compatibility, phone numbers
    // are stored separately as a list in zn_pf_client_cells
    const phoneNumber = dto.phoneNumbers[0]?.value || null;

    // make sure the user does not take ownership of a client
    // that somebody else already entered into the database
    // this is a business requirement, not a technical solution
    // to preventing duplicates (we have unique constraints for that)
    const existingClient = await this.find({ email, phoneNumber });
    if (existingClient) {
      throw new AppError("Client already exists", {
        statusCode: 409,
        extra: {
          name,
          email,
          phoneNumber,
        },
      });
    }

    const client = await Client.create(
      {
        statusID: ClientStatusID.ACTIVE,
        source: source || SourcePlatform.AFFILIATES_MOBILE_APP,
        userID: owner.userID,
        agencyID: owner.agencyID,
        name,
        email,
        address,
        countryID,
        locationID,
        comment,
        referralType: ClientReferralType.AFFILIATE,
        referralID: owner.affiliateID,
        ClientPhoneNumbers: phoneNumbers.map((phoneNumber: CreateClientPhoneNumberDTO) => ({
          value: phoneNumber.value,
          // add the short version too because the staff app duplication check is based on the short version
          shortValue: phoneNumber.value.slice(-9),
        })),
      },
      {
        include: [ClientPhoneNumber],
      }
    );

    return this.serialize(client);
  }

  /**
   * Serializes a queried {@see Client} model instance into a DTO.
   */
  private serialize(client: Client): ClientDTO {
    return {
      id: client.id,
      name: client.name,
      email: client.email || null,
      phoneNumbers: client.ClientPhoneNumbers.map((phoneNumber: ClientPhoneNumber) => ({
        id: phoneNumber.id,
        value: phoneNumber.value,
      })),
      address: client.address || null,
      locationID: client.locationID || null,
      comment: client.comment || null,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    };
  }

  /**
   * Sanitizes the specified phone number into a valid E.164 phone number.
   */
  private sanitizePhoneNumber(value: string): string {
    const errorMessage = `${value} is not a valid phone number`;
    const errorData = { statusCode: 400 };

    let parsedPhoneNumber: PhoneNumber | undefined | null = null;

    try {
      parsedPhoneNumber = parsePhoneNumberFromString(value);
    } catch (error) {
      throw new AppError(errorMessage, { ...errorData, error });
    }

    if (!parsedPhoneNumber) {
      throw new AppError(errorMessage, errorData);
    }

    return parsedPhoneNumber.number as string;
  }
}

export default ClientsService;
