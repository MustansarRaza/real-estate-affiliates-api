import { ListingReservationSource } from "@pf/taxonomies";
import each from "jest-each";
import MockDate from "mockdate";
import { Response } from "supertest";
import { loadSequelizeFixtures, useRequestFactory } from "./support";
import { createReservation, ModelFixtureConstants, ModelFixtureNames } from "./support/data";
describe("reservations", () => {
  beforeAll(() => {
    MockDate.set("2020-10-29T05:53:00.270Z");
  });

  afterAll(() => {
    MockDate.reset();
  });

  beforeEach(async () => {
    await loadSequelizeFixtures(
      ModelFixtureNames.AGENTS,
      ModelFixtureNames.USERS,
      ModelFixtureNames.CONTACTS,
      ModelFixtureNames.CATEGORIES,
      ModelFixtureNames.COUNTRIES,
      ModelFixtureNames.LOCATIONS,
      ModelFixtureNames.AFFILIATES,
      ModelFixtureNames.AFFILIATE_CONTACTS,
      ModelFixtureNames.AFFILIATE_ASSIGNEES,
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
  });

  const createReservationDTO = {
    leadID: 1,
    listingID: 1,
    reservedBy: ModelFixtureConstants.verifiedAffiliateID,
    reservedFor: ModelFixtureConstants.staffUserBDMID,
    comments: "test",
  };

  const makeRequest = (params = {}): Promise<Response> =>
    useRequestFactory()
      .withVerifiedUser()
      .post("/reservations")
      .send({ ...createReservationDTO, ...params });
  it("denies access to unauthenticated requests", async () => {
    const { body, header } = await useRequestFactory()
      .post("/reservations")
      .expect(403);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });
  describe("POST / reservations", () => {
    it("successfully creates reservation", async () => {
      const { status, body, header } = await makeRequest();

      expect(status).toBe(201);
      expect(body).toMatchSnapshot();
      expect(header).toMatchSnapshot();
    });

    it("successfully creates reservation with source explicitly set", async () => {
      const { status, body, header } = await makeRequest({
        source: ListingReservationSource.PROPFORCE,
      });

      expect(status).toBe(201);
      expect(body).toMatchSnapshot();
      expect(header).toMatchSnapshot();
    });

    each(["listingID", "leadID"]).it("does not allow null %s", async (key) => {
      const { status, body } = await makeRequest({ [key]: null });

      expect(status).toBe(400);
      expect(body).toMatchSnapshot();
    });
    it("does not allow invalid source", async () => {
      const { status, body } = await makeRequest({ source: "someSourceThatISSurelyInvalid" });

      expect(status).toBe(400);
      expect(body).toMatchSnapshot();
    });
  });
  describe("GET / reservations", () => {
    it("denies access to unauthenticated requests", async () => {
      const { body, header } = await useRequestFactory()
        .get("/reservations")
        .expect(403);

      expect(body).toMatchSnapshot();
      expect(header).toMatchSnapshot();
    });
    it("gets reservations of affiliate", async () => {
      await createReservation(1, 2);
      const { body, header } = await useRequestFactory()
        .withVerifiedUser()
        .get("/reservations")
        .expect(200);

      expect(body).toMatchSnapshot();
      expect(header).toMatchSnapshot();
    });
  });
});
