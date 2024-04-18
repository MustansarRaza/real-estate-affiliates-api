import { addDays } from "date-fns";
import {
  Client,
  Lead,
  Listing,
  ListingReservation,
  ListingStatusID,
  sequelize,
} from "affiliates-api/models";
import { ISO8601DateTime } from "affiliates-api/types";
import { AppError } from "@pf/utils";

import ListingsService from "./listings";
import MeService from "./me";
import Sequelize, { Op } from "sequelize";
import {
  ListingReservationSource,
  ListingReservationStatus,
  ListingReservationReservedByType,
} from "@pf/taxonomies";
import { getMaxActiveAffiliateReservations } from "affiliates-api/features";
import { ErrorMessages } from "./constants";

interface ListingReservationDTO {
  id: number;
  listingID: number;
  leadID: number | null;
  reservedFor: number | null;
  reservedBy: number | null;
  updatedBy: number | null;
  status: ListingReservationStatus | null;
  comments: string | null;
  source: ListingReservationSource;
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
  expiryDate: ISO8601DateTime | null;
  listing: ReservationListingData | null;
}
interface ReservationListingData {
  categoryID: number | null;
  unitNumber: string | null;
}

export type ListingReservationOptions = {
  leadID: number;
  listingID: number;
  comments: string | null;
  source: ListingReservationSource | null;
};

interface BySSOIDLookup {
  ssoID: string;
}

interface OtherServices {
  me: MeService;
  listings: ListingsService;
}

class ListingReservationService {
  constructor(private services: OtherServices) {}

  /**
   * Reserve an active listing. This method both inserts a reservation entry and updates the listing status
   * @param ssoID
   * @param options
   */
  async create(
    { ssoID }: BySSOIDLookup,
    options: ListingReservationOptions
  ): Promise<ListingReservationDTO | null> {
    const { affiliate } = await this.services.me.get({ ssoID });

    if (!affiliate) {
      throw new AppError(ErrorMessages.USER_AFFILIATE_ERROR_MESSAGE, {
        statusCode: 404,
        extra: {
          ssoID,
        },
      });
    }
    const [leadUser, listing] = await Promise.all([
      Lead.findOne({
        where: {
          id: {
            [Op.eq]: options.leadID,
          },
        },
        attributes: [],
        include: [
          {
            model: Client,
            required: true,
            attributes: ["userID"],
          },
        ],
      }),
      this.services.listings.find({
        listingID: options.listingID,
        agencyID: affiliate.agencyID,
      }),
    ]);

    if (!listing) {
      throw new AppError("Listing not found or already reserved", {
        statusCode: 404,
        extra: {
          ssoID,
        },
      });
    }

    const activeReservations = (await ListingReservation.findAll({
      where: {
        [Op.and]: {
          reservedBy: {
            [Op.eq]: affiliate.id,
          },
          status: {
            [Op.in]: [
              ListingReservationStatus.PENDING,
              ListingReservationStatus.APPROVED,
              ListingReservationStatus.PENDING_EXTENSION,
            ],
          },
          reservedByType: {
            [Op.eq]: ListingReservationReservedByType.AFFILIATE,
          },
        },
      },
      group: ["leadID"],
      raw: true,
      attributes: ["leadID", [Sequelize.fn("COUNT", "leadID"), "count"]],
    })) as { leadID: number; count: number }[];

    const leadActiveReservationCount =
      activeReservations.find((res: any) => res.leadID === options.leadID && res.count > 0)
        ?.count || 0;

    const allReservationsCount = activeReservations.reduce((a: number, b: any) => a + b.count, 0);

    if (
      leadActiveReservationCount > 0 ||
      allReservationsCount >= getMaxActiveAffiliateReservations()
    ) {
      throw new AppError("Cannot reserve more units for this lead", {
        statusCode: 400,
        extra: {
          ssoID,
          leadActiveReservationCount, //this provides the necessary and sufficient information to figure out the reservation rejection reason
        },
      });
    }

    const result = await sequelize.transaction(async () => {
      try {
        const reservation = await ListingReservation.create({
          ...options,
          reservedBy: affiliate.id,
          reservedFor: leadUser?.Client.userID || null,
          status: ListingReservationStatus.PENDING,
          source: options.source || ListingReservationSource.AFFILIATES_MOBILE_APP,
          reservedByType: ListingReservationReservedByType.AFFILIATE,
          expiryDate: addDays(new Date(), 1),
        });
        await Listing.update(
          { statusID: ListingStatusID.RESERVED_HOLD },
          { where: { id: { [Op.eq]: reservation.listingID } } }
        );
        return reservation;
      } catch (error) {
        if (error.name === "SequelizeForeignKeyConstraintError") {
          throw new AppError("Cannot find lead or user for this reservation", {
            statusCode: 400,
            error,
            extra: {
              ssoID,
            },
          });
        }

        throw error;
      }
    });
    result.Listing = listing;
    return this.serialize(result);
  }

  /**
   * Gets a list of reservations made by an affiliate
   */
  async list({ ssoID }: BySSOIDLookup): Promise<ListingReservation[]> {
    try {
      const profile = await this.services.me.get({ ssoID });

      const reservedBy = profile.affiliate?.id;

      const reservations = await ListingReservation.findAll({
        where: {
          reservedBy: { [Op.eq]: reservedBy },
          reservedByType: ListingReservationReservedByType.AFFILIATE,
        },
        include: [{ model: Listing, attributes: ["unitNumber", "categoryID"] }],
      });

      return reservations.map((reservation: ListingReservation) => this.serialize(reservation));
    } catch (error) {
      if (error.message === ErrorMessages.USER_AFFILIATE_ERROR_MESSAGE) {
        return [];
      }
      throw error;
    }
  }

  private serialize(reservation: ListingReservation): ListingReservationDTO {
    return {
      id: reservation.id,
      listingID: reservation.listingID,
      leadID: reservation.leadID,
      reservedFor: reservation.reservedFor,
      reservedBy: reservation.reservedBy,
      updatedBy: reservation.updatedBy,
      status: reservation.status,
      comments: reservation.comments,
      source: reservation.source,
      createdAt: reservation.createdAt.toISOString(),
      updatedAt: reservation.updatedAt.toISOString(),
      expiryDate: reservation.expiryDate?.toISOString() || null,
      listing: reservation.Listing && {
        categoryID: reservation.Listing.categoryID || null,
        unitNumber: reservation.Listing.unitNumber || null,
      },
    };
  }
}

export default ListingReservationService;
