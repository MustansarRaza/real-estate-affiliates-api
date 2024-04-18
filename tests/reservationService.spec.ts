import { ListingReservationSource, ListingReservationStatus } from "@pf/taxonomies";
import { AppError } from "@pf/utils";
import {
  Listing,
  ListingAgainstType,
  ListingReservation,
  ListingStatusID,
  PotentialAffiliateStatus,
} from "affiliates-api/models";
import { CreateReservationDTO, ListingDTO, MeDTO } from "affiliates-api/services";
import ListingReservationService from "affiliates-api/services/reservations";
import MockDate from "mockdate";
import { Op } from "sequelize";
import { loadSequelizeFixtures, useMockedServices } from "./support";
import { createReservation, ModelFixtureConstants, ModelFixtureNames } from "./support/data";

const expectNoReservationsToBeCreated = async () => {
  const allReservations = await ListingReservation.findAll({});
  expect(allReservations).toBeTruthy();
  expect(allReservations).toHaveLength(0);
};

describe("Reservation Service", () => {
  const mockedServices = useMockedServices();
  const service = new ListingReservationService(mockedServices);
  const reservationListingID = 1;
  const reservationLeadID = 1;
  let reservation: CreateReservationDTO;

  beforeAll(() => {
    MockDate.set("2020-10-29T05:53:00.270Z");
  });

  afterAll(() => {
    MockDate.reset();
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    mockedServices.me.get.mockReturnValue(
      Promise.resolve(({
        affiliate: {
          id: ModelFixtureConstants.verifiedAffiliateID,
          agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        },
        status: PotentialAffiliateStatus.VERIFIED,
      } as Partial<MeDTO>) as MeDTO)
    );
    mockedServices.listings.find.mockReturnValue(
      Promise.resolve(({
        id: reservationListingID,
        against: { type: ListingAgainstType.PROJECT, id: 1 },
        images: [],
      } as Partial<ListingDTO>) as ListingDTO)
    );
    await loadSequelizeFixtures(
      ModelFixtureNames.AGENTS,
      ModelFixtureNames.USERS,
      ModelFixtureNames.CONTACTS,
      ModelFixtureNames.CATEGORIES,
      ModelFixtureNames.COUNTRIES,
      ModelFixtureNames.LOCATIONS,
      ModelFixtureNames.AFFILIATES,
      ModelFixtureNames.AFFILIATE_CONTACTS,
      ModelFixtureNames.POTENTIAL_AFFILIATE_VERIFICATION_STATUS,
      ModelFixtureNames.POTENTIAL_AFFILIATES,
      ModelFixtureNames.CLIENTS,
      ModelFixtureNames.LEAD_STATUSES,
      ModelFixtureNames.LEADS,
      ModelFixtureNames.LEAD_LOCATIONS,
      ModelFixtureNames.ADDRESSES,
      ModelFixtureNames.PROJECTS,
      ModelFixtureNames.LISTING_STATUSES,
      ModelFixtureNames.LISTINGS
    );

    reservation = {
      leadID: reservationLeadID,
      listingID: reservationListingID,
      comments: "test comment",
      source: ListingReservationSource.AFFILIATES_MOBILE_APP,
    };
  });
  describe("create", () => {
    it("successfully creates reservation if listing and owner are found", async () => {
      const reservationDTO = await service.create(
        { ssoID: ModelFixtureConstants.verifiedSSOID },
        reservation
      );

      const reservations = await ListingReservation.findAll({});
      expect(reservations).toBeTruthy();
      expect(reservations).toHaveLength(1);
      expect({ ...reservations[0]?.toJSON(), id: null }).toMatchSnapshot();

      expect(reservationDTO).toBeTruthy();
      expect(reservationDTO?.listingID).toBe(reservationListingID);
      expect(reservationDTO?.leadID).toBe(reservationLeadID);
      expect(reservationDTO?.reservedBy).toBe(ModelFixtureConstants.verifiedAffiliateID);
      expect(reservationDTO?.status).toBe(ListingReservationStatus.PENDING);
      expect(reservationDTO?.comments).toBe("test comment");
      expect(reservationDTO?.source).toBe(ListingReservationSource.AFFILIATES_MOBILE_APP);

      // successfully updates listing status
      const reservedListing = await Listing.findOne({
        where: { id: { [Op.eq]: reservationListingID } },
      });
      expect(reservedListing).toBeTruthy();
      expect(reservedListing?.id).toBe(reservationListingID);
      expect(reservedListing?.statusID).toBe(ListingStatusID.RESERVED_HOLD);
    });

    it("does no create reservation if listing is not found", async () => {
      mockedServices.listings.find.mockReturnValue(Promise.resolve(null));

      await expect(
        service.create({ ssoID: ModelFixtureConstants.verifiedSSOID }, reservation)
      ).rejects.toMatchSnapshot();

      await expectNoReservationsToBeCreated();
    });
    it("does not create reservation if affiliate is not found", async () => {
      mockedServices.me.get.mockReturnValue(
        Promise.resolve(({
          affiliate: null,
          status: PotentialAffiliateStatus.VERIFIED,
        } as Partial<MeDTO>) as MeDTO)
      );

      await expect(
        service.create({ ssoID: ModelFixtureConstants.verifiedSSOID }, reservation)
      ).rejects.toMatchSnapshot();
      await expectNoReservationsToBeCreated();
    });
    it("does not create reservation if lead id is invalid", async () => {
      await expect(
        service.create(
          { ssoID: ModelFixtureConstants.verifiedSSOID },
          { ...reservation, leadID: 999 }
        )
      ).rejects.toMatchSnapshot();
      await expectNoReservationsToBeCreated();

      // don't touch listing if reservation creation is aborted
      const listing = await Listing.findOne({ where: { id: { [Op.eq]: reservationListingID } } });
      expect(listing.statusID).toBe(ListingStatusID.AVAILABLE);
    });
    it("does not create reservation if the lead already has an active reservation made by this affiliate", async () => {
      await createReservation(2, reservationLeadID);
      await expect(
        service.create({ ssoID: ModelFixtureConstants.verifiedSSOID }, reservation)
      ).rejects.toMatchSnapshot();
    });
    it("does not create reservation if the affiliate has too many active reservations", async () => {
      await createReservation(2, 2);
      await createReservation(2, 2);
      await expect(
        service.create({ ssoID: ModelFixtureConstants.verifiedSSOID }, reservation)
      ).rejects.toMatchSnapshot();
    });
  });
  describe("list", () => {
    it("successfully returns list of reservations for affiliate", async () => {
      const goodReservation = await createReservation(reservationListingID, reservationLeadID);
      const reservations = await service.list({ ssoID: ModelFixtureConstants.verifiedSSOID });
      expect(reservations).toBeTruthy();
      expect(reservations).toHaveLength(1);
      expect(reservations[0].id).toBe(goodReservation.id);
    });

    it("returns empty if user is not an affiliate", async () => {
      mockedServices.me.get.mockImplementation(() => {
        throw new AppError("Current user is not an affiliate", { statusCode: 404 });
      });

      const result = await service.list({ ssoID: ModelFixtureConstants.verifiedSSOID });
      expect(result).toHaveLength(0);
    });

    it("throws an error if something goes wrong", async () => {
      mockedServices.me.get.mockImplementation(() => {
        throw new AppError("Something is wrong", { statusCode: 404 });
      });

      await expect(
        service.list({ ssoID: ModelFixtureConstants.verifiedSSOID })
      ).rejects.toMatchSnapshot();
    });
  });
});
