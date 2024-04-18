import MockDate from "mockdate";
import { loadSequelizeFixtures, useRequestFactory } from "./support";
import { ModelFixtureNames } from "./support/data";

describe("GET /markets/primary/projects", () => {
  beforeEach(async () => {
    MockDate.set("2021-04-30T12:00:00+0000");
    await loadSequelizeFixtures(
      ModelFixtureNames.AGENTS,
      ModelFixtureNames.USERS,
      ModelFixtureNames.CONTACTS,
      ModelFixtureNames.COUNTRIES,
      ModelFixtureNames.LOCATIONS,
      ModelFixtureNames.CATEGORIES,
      ModelFixtureNames.ADDRESSES,
      ModelFixtureNames.PROJECTS,
      ModelFixtureNames.PROJECT_IMAGES,
      ModelFixtureNames.LISTING_STATUSES,
      ModelFixtureNames.LISTINGS,
      ModelFixtureNames.AFFILIATES,
      ModelFixtureNames.AFFILIATE_CONTACTS,
      ModelFixtureNames.AFFILIATE_ASSIGNEES,
      ModelFixtureNames.POTENTIAL_AFFILIATE_VERIFICATION_STATUS,
      ModelFixtureNames.POTENTIAL_AFFILIATES,
      ModelFixtureNames.AFFILIATE_COMMISSION_PROPERTY_TYPE,
      ModelFixtureNames.AFFILIATE_COMMISSION,
      ModelFixtureNames.CONTRACT_STATUSES,
      ModelFixtureNames.CONTRACTS,
      ModelFixtureNames.CONTRACT_LISTINGS
    );
  });

  afterEach(() => {
    MockDate.reset();
  });

  it("denies access to unauthenticated requests", async () => {
    const { body, header } = await useRequestFactory()
      .get("/markets/primary/projects")
      .expect(403);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("returns a list of available projects", async () => {
    const { body, header } = await useRequestFactory()
      .withVerifiedUser()
      .get("/markets/primary/projects")
      .expect(200);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("returns an empty list for unverified users", async () => {
    const { body } = await useRequestFactory()
      .withUnverifiedUser()
      .get("/markets/primary/projects")
      .expect(200);

    expect(body).toHaveLength(0);
    expect(body).toMatchSnapshot();
  });
});
