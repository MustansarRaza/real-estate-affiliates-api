import {
  Address,
  AreaUnit,
  AreaUnitID,
  ListingAgainstType,
  ListingAllocationID,
  ListingCommissionType,
  ListingStatusID,
  ListingVisibilityID,
  Purpose,
  PurposeID,
} from "affiliates-api/models";
import { ListingDTO, ListingsService } from "affiliates-api/services";
import each from "jest-each";
import { loadSequelizeFixtures, useMockedServices } from "./support";
import {
  createListing,
  createListingImage,
  createMediaBankImage,
  ModelFixtureConstants,
  ModelFixtureNames,
} from "./support/data";

describe("ListingsService", () => {
  const mockedServices = useMockedServices();
  const service = new ListingsService(mockedServices);

  beforeEach(async () => {
    await loadSequelizeFixtures(
      ModelFixtureNames.COUNTRIES,
      ModelFixtureNames.LOCATIONS,
      ModelFixtureNames.ADDRESSES,
      ModelFixtureNames.CATEGORIES,
      ModelFixtureNames.PROJECTS,
      ModelFixtureNames.LISTING_STATUSES
    );
    jest.resetAllMocks();
  });

  describe("list", () => {
    it("lists all available listings if no filters", async () => {
      const listing1 = await createListing({ againstType: ListingAgainstType.PROJECT });
      const listing2 = await createListing({ againstType: ListingAgainstType.LEAD });

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(listings).toHaveLength(2);
      expect(listings[0].id).toBe(listing2.id);
      expect(listings[1].id).toBe(listing1.id);
    });

    it("only lists listings linked to the specified agency", async () => {
      await createListing({ agencyID: 99, againstType: ListingAgainstType.PROJECT });
      const listing2 = await createListing({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        againstType: ListingAgainstType.LEAD,
      });

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(listings).toHaveLength(1);
      expect(listings[0].id).toBe(listing2.id);
    });

    it("applies againstType filter if applied", async () => {
      await createListing({ againstType: ListingAgainstType.PROJECT });
      const listing2 = await createListing({ againstType: ListingAgainstType.LEAD });

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        againstType: ListingAgainstType.LEAD,
      });
      expect(listings).toHaveLength(1);
      expect(listings[0].id).toBe(listing2.id);
    });

    it("applies againstID filter if applied", async () => {
      await createListing({ againstID: 1 });
      const listing2 = await createListing({ againstID: 2 });

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        againstID: 2,
      });
      expect(listings).toHaveLength(1);
      expect(listings[0].id).toBe(listing2.id);
    });

    it("only lists active listings", async () => {
      const activeListing = await createListing({
        statusID: ListingStatusID.AVAILABLE,
      });
      // all of these listings should not be listed
      await Promise.all(
        Object.values(ListingStatusID)
          .filter(
            (statusID) => typeof statusID === "number" && statusID !== ListingStatusID.AVAILABLE
          )
          .map((statusID) => createListing({ statusID }))
      );

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(listings).toHaveLength(1);
      expect(listings[0].id).toBe(activeListing.id);
    });

    it("only lists listings that are available for affiliates", async () => {
      const listing1 = await createListing({
        visibilityID: ListingVisibilityID.AFFILIATE,
      });

      const listing2 = await createListing({
        visibilityID: ListingVisibilityID.STAFF_AFFILIATE,
      });

      // should not be listed
      await createListing({
        visibilityID: ListingVisibilityID.STAFF,
      });

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(listings).toHaveLength(2);
      expect(listings[0].id).toBe(listing2.id);
      expect(listings[1].id).toBe(listing1.id);
    });

    it("only lists listings that are not allocated", async () => {
      const listing1 = await createListing({
        allocationID: ListingAllocationID.OPEN,
      });

      const listing2 = await createListing({
        allocationID: ListingAllocationID.INVESTOR_QUOTA,
      });

      // should not be listed
      await createListing({
        allocationID: ListingAllocationID.CLOSED,
      });

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(listings).toHaveLength(2);
      expect(listings[0].id).toBe(listing2.id);
      expect(listings[1].id).toBe(listing1.id);
    });

    it("lists listings ordered by unit number", async () => {
      const listing1 = await createListing({
        unitNumber: "B1",
      });

      const listing2 = await createListing({
        unitNumber: "A2",
      });

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });

      expect(listings).toHaveLength(2);
      expect(listings[0].unitNumber).toBe(listing2.unitNumber);
      expect(listings[1].unitNumber).toBe(listing1.unitNumber);
    });

    it("translates purpose ID into a string", async () => {
      const listingForSale = await createListing({
        purposeID: PurposeID.FOR_SALE,
      });

      const listingForRent = await createListing({
        purposeID: PurposeID.FOR_RENT,
      });

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });

      expect(listings).toHaveLength(2);

      expect(listings[0].id).toBe(listingForRent.id);
      expect(listings[0].purpose).toBe(Purpose.FOR_RENT);
      expect(listings[1].id).toBe(listingForSale.id);
      expect(listings[1].purpose).toBe(Purpose.FOR_SALE);
    });

    each(["", null, undefined]).it("returns null for url if is %s", async (url) => {
      const listing = await createListing({
        url,
      });

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });

      expect(listings).toHaveLength(1);

      expect(listings[0].id).toBe(listing.id);
      expect(listings[0].url).toBe(null);
    });

    it("returns null for area if no data is available", async () => {
      const listing = await createListing({
        areaCovered: null,
        areaFree: null,
        areaTotal: null,
      });

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(listings[0].id).toBe(listing.id);
      expect(listings[0].area).toBe(null);
    });

    it("computes total area if not available", async () => {
      const listing = await createListing({
        areaUnitID: AreaUnitID.KANAL,
        areaCovered: 10,
        areaFree: 5,
      });

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(listings[0].id).toBe(listing.id);
      expect(listings[0].area).toStrictEqual({
        unit: AreaUnit.KANAL,
        value: {
          covered: 10,
          free: 5,
          total: 15,
        },
      });
    });

    it("assumes the area unit is sqft if not available", async () => {
      const listing = await createListing({
        areaUnitID: null,
        areaCovered: 10,
        areaFree: 5,
      });

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(listings[0].id).toBe(listing.id);
      expect(listings[0].area?.unit).toBe(AreaUnit.SQFT);
    });

    it("returns null for price if not available", async () => {
      const listing = await createListing({
        price: null,
      });

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(listings[0].id).toBe(listing.id);
      expect(listings[0].price).toBe(null);
    });

    it("does not convert 0 for bed and bathroom count into null", async () => {
      const listing = await createListing({
        bedroomCount: 0,
        bathroomCount: 0,
      });

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(listings[0].id).toBe(listing.id);
      expect(listings[0].bedroomCount).toBe(0);
      expect(listings[0].bathroomCount).toBe(0);
    });

    it("assumes the commission structure is percentage if unknown", async () => {
      const listing = await createListing({
        commissionValue: 2.5,
      });

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(listings[0].id).toBe(listing.id);
      expect(listings[0].commission).toStrictEqual({
        type: ListingCommissionType.PERCENTAGE,
        value: 2.5,
      });
    });

    it("returns only active images", async () => {
      const listing = await createListing();
      const mediaBankImage1 = await createMediaBankImage();
      const listingImage1 = await createListingImage(listing.id, mediaBankImage1.id, {
        isDeleted: false,
      });
      const mediaBankImage2 = await createMediaBankImage();
      await createListingImage(listing.id, mediaBankImage2.id, { isDeleted: true });

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(listings[0].id).toBe(listing.id);
      expect(listings[0].images).toHaveLength(1);
      expect(listings[0].images[0].id).toBe(listingImage1.id);
      expect(listings[0].images).toMatchSnapshot();
    });

    it("returns only images with a valid media bank image", async () => {
      const listing = await createListing();
      await createListingImage(listing.id, null);

      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(listings[0].id).toBe(listing.id);
      expect(listings[0].images).toHaveLength(0);
    });

    each([
      [
        "locationID",
        {
          locationID: 6,
          countryLocationID: 1,
          regionLocationID: 2,
          cityLocationID: 3,
          localityLocationID: 4,
          phaseLocationID: 5,
        },
      ],
      [
        "phaseLocationID",
        {
          countryLocationID: 1,
          regionLocationID: 2,
          cityLocationID: 3,
          localityLocationID: 4,
          phaseLocationID: 5,
        },
      ],
      [
        "localityLocationID",
        { countryLocationID: 1, regionLocationID: 2, cityLocationID: 3, localityLocationID: 4 },
      ],
      ["cityLocationID", { countryLocationID: 1, regionLocationID: 2, cityLocationID: 3 }],
      ["regionLocationID", { countryLocationID: 1, regionLocationID: 2 }],
      ["countryLocationID", { countryLocationID: 1 }],
    ]).it("returns address's %s of the leaf location", async (addressFieldName, addressFields) => {
      const address = await Address.create(addressFields);
      const expectedLocationID = addressFields[addressFieldName];

      const listing = await createListing({ addressID: address.id });
      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(listings[0].id).toBe(listing.id);
      expect(listings[0].locationID).toBe(expectedLocationID);
    });

    it("returns null for locationID if no ID can be found in the address", async () => {
      const address = await Address.create({});

      const listing = await createListing({ addressID: address.id });
      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(listings[0].id).toBe(listing.id);
      expect(listings[0].locationID).toBe(null);
    });

    it("correctly filters by price if price filters are given", async () => {
      await createListing({ price: 5 });
      const listing = await createListing({ price: 10 });
      await createListing({ price: 15 });
      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        minPrice: 6,
        maxPrice: 11,
      });
      expect(listings).toBeTruthy();
      expect(listings).toHaveLength(1);
      expect(listings[0].id).toBe(listing.id);
    });
    it("correctly filters by area if area filters are given", async () => {
      await createListing({ areaTotal: 10 });
      const listing = await createListing({ areaTotal: 15 });
      await createListing({ areaTotal: 20 });
      const listings = await service.list({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        minArea: 11,
        maxArea: 17,
      });
      expect(listings).toBeTruthy();
      expect(listings).toHaveLength(1);
      expect(listings[0].id).toBe(listing.id);
    });
  });
  it("correctly filters by categoryIDs if categoryIDs are given", async () => {
    await Promise.all([1, 1, 2, 3, 4].map((categoryID: number) => createListing({ categoryID })));
    const listings = await service.list({
      agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      categoryIDs: [1, 2],
    });
    expect(listings).toBeTruthy();
    expect(listings).toHaveLength(3);
    // finds both listings with same categoryID 1
    expect(listings.filter((listing: ListingDTO) => listing.categoryID === 1)).toHaveLength(2);
    // no listing is found outside of the filter criterion
    expect(
      listings.filter((listing: ListingDTO) => listing.categoryID === 3 || listing.categoryID === 4)
    ).toHaveLength(0);
  });

  describe("statsGroupedBy", () => {
    it("returns stats grouped by", async () => {
      const againstID1 = 1337;
      const againstID2 = 7331;

      await createListing({ againstID: againstID1, categoryID: 4, price: 400 });
      await createListing({ againstID: againstID1, categoryID: 3, price: 300 });
      await createListing({ againstID: againstID2, categoryID: 3, price: 500 });

      const stats = await service.statsGroupedBy({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(stats.size).toBe(2);
      expect(stats.get(againstID1)).toStrictEqual({
        count: 2,
        categoryIDs: [4, 3],
        minPrice: 300,
        maxPrice: 400,
      });
      expect(stats.get(againstID2)).toStrictEqual({
        count: 1,
        categoryIDs: [3],
        minPrice: 500,
        maxPrice: 500,
      });
    });

    it("only uses open listings", async () => {
      const againstID = 1;

      await createListing({ againstID, categoryID: 3, price: 400 });
      await createListing({
        againstID,
        statusID: ListingStatusID.CLOSED,
        price: 500,
        categoryID: 4,
      });

      const stats = await service.statsGroupedBy({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(stats.size).toBe(1);
      expect(stats.get(againstID)).toStrictEqual({
        count: 1,
        categoryIDs: [3],
        minPrice: 400,
        maxPrice: 400,
      });
    });

    it("only uses listings matching the agency ID", async () => {
      const againstID = 1;

      await createListing({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        againstID,
        categoryID: 3,
        price: 400,
      });
      await createListing({
        agencyID: 999,
        againstID,
        price: 500,
        categoryID: 4,
      });

      const stats = await service.statsGroupedBy({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(stats.size).toBe(1);
      expect(stats.get(againstID)).toStrictEqual({
        count: 1,
        categoryIDs: [3],
        minPrice: 400,
        maxPrice: 400,
      });
    });

    it("only uses listings available for affiliates", async () => {
      const againstID = 1;

      await createListing({ againstID, categoryID: 3, price: 400 });
      await createListing({
        againstID,
        visibilityID: ListingVisibilityID.STAFF,
        price: 500,
        categoryID: 4,
      });

      const stats = await service.statsGroupedBy({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(stats.size).toBe(1);
      expect(stats.get(againstID)).toStrictEqual({
        count: 1,
        categoryIDs: [3],
        minPrice: 400,
        maxPrice: 400,
      });
    });

    it("only uses non-closed listings", async () => {
      const againstID = 1;

      await createListing({ againstID, categoryID: 3, price: 400 });
      await createListing({
        againstID,
        allocationID: ListingAllocationID.CLOSED,
        price: 500,
        categoryID: 4,
      });

      const stats = await service.statsGroupedBy({
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      expect(stats.size).toBe(1);
      expect(stats.get(againstID)).toStrictEqual({
        count: 1,
        categoryIDs: [3],
        minPrice: 400,
        maxPrice: 400,
      });
    });
  });

  describe("getSoldListingsCount", () => {
    it("returns soldCount grouped by againstID", async () => {
      const againstID1 = 1;
      const againstID2 = 7331;

      await loadSequelizeFixtures(
        ModelFixtureNames.LISTINGS,
        ModelFixtureNames.CONTRACT_STATUSES,
        ModelFixtureNames.CONTRACTS,
        ModelFixtureNames.CONTRACT_LISTINGS
      );

      const soldCount = await service.getSoldListingsCount(
        ModelFixtureConstants.verifiedAffiliateAgencyID,
        [againstID1, againstID2]
      );
      expect(soldCount.size).toBe(1);
      expect(soldCount.get(againstID1)).toStrictEqual(2);
      expect(soldCount.get(againstID2)).toBeUndefined();
    });

    it("only uses listings matching the agency ID", async () => {
      const againstID = 1;

      await loadSequelizeFixtures(
        ModelFixtureNames.LISTINGS,
        ModelFixtureNames.CONTRACT_STATUSES,
        ModelFixtureNames.CONTRACTS,
        ModelFixtureNames.CONTRACT_LISTINGS
      );

      const soldCount = await service.getSoldListingsCount(
        ModelFixtureConstants.verifiedAffiliateAgencyID,
        [againstID]
      );
      expect(soldCount.size).toBe(1);
      expect(soldCount.get(againstID)).toStrictEqual(2);
    });

    it("it only uses those listings having againstID that is provided", async () => {
      const againstID1 = 1;
      const againstID2 = 5;

      await loadSequelizeFixtures(
        ModelFixtureNames.LISTINGS,
        ModelFixtureNames.CONTRACT_STATUSES,
        ModelFixtureNames.CONTRACTS,
        ModelFixtureNames.CONTRACT_LISTINGS
      );

      const soldCount = await service.getSoldListingsCount(
        ModelFixtureConstants.verifiedAffiliateAgencyID,
        [againstID1]
      );
      expect(soldCount.size).toBe(1);
      expect(soldCount.get(againstID1)).toStrictEqual(2);
      expect(soldCount.get(againstID2)).toBeUndefined();
    });
  });

  describe("find", () => {
    it("successfully finds active listing visible to affiliates", async () => {
      const listing = await createListing({
        statusID: ListingStatusID.AVAILABLE,
        allocationID: ListingAllocationID.OPEN,
        visibilityID: ListingVisibilityID.STAFF_AFFILIATE,
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });
      const foundListing = await service.find({
        listingID: listing.id,
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });

      expect(foundListing).toBeTruthy();
      expect(foundListing?.id).toBe(listing.id);
    });

    it("does not find listing with invalid id", async () => {
      const listing = await createListing();

      const foundListing = await service.find({
        listingID: listing.id + 999,
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });

      expect(foundListing).toBeNull();
    });

    it("does not find reserved listing", async () => {
      const listing = await createListing({ statusID: ListingStatusID.RESERVED_HOLD });

      const foundListing = await service.find({
        listingID: listing.id,
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });

      expect(foundListing).toBeNull();
    });
  });
});
