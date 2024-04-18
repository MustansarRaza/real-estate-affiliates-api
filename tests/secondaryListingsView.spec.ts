import { loadSequelizeFixtures, useRequestFactory } from "./support";
import { ModelFixtureNames } from "./support/data";

describe("GET /markets/secondary/listings", () => {
  beforeEach(async () => {
    await loadSequelizeFixtures(
      ModelFixtureNames.AGENTS,
      ModelFixtureNames.USERS,
      ModelFixtureNames.CONTACTS,
      ModelFixtureNames.COUNTRIES,
      ModelFixtureNames.LOCATIONS,
      ModelFixtureNames.ADDRESSES,
      ModelFixtureNames.CATEGORIES,
      ModelFixtureNames.LISTING_STATUSES,
      ModelFixtureNames.PROJECTS,
      ModelFixtureNames.LISTINGS,
      ModelFixtureNames.MEDIA_BANK_IMAGES,
      ModelFixtureNames.LISTING_IMAGES,
      ModelFixtureNames.AFFILIATES,
      ModelFixtureNames.AFFILIATE_CONTACTS,
      ModelFixtureNames.AFFILIATE_ASSIGNEES,
      ModelFixtureNames.POTENTIAL_AFFILIATE_VERIFICATION_STATUS,
      ModelFixtureNames.POTENTIAL_AFFILIATES
    );
  });

  it("denies access to unauthenticated requests", async () => {
    const { body, header } = await useRequestFactory()
      .get(`/markets/secondary/listings`)
      .expect(403);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("returns a list of available listings for a project", async () => {
    const { body } = await useRequestFactory()
      .withVerifiedUser()
      .get(`/markets/secondary/listings`)
      .expect(200);

    expect(body).toHaveLength(2);
    expect(body).toMatchSnapshot();
  });

  it("returns an empty list for unverified users", async () => {
    const { body } = await useRequestFactory()
      .withUnverifiedUser()
      .get(`/markets/secondary/listings`)
      .expect(200);

    expect(body).toHaveLength(0);
    expect(body).toMatchSnapshot();
  });
});
