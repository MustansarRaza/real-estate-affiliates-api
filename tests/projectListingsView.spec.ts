import each from "jest-each";
import { loadSequelizeFixtures, useRequestFactory } from "./support";
import { ModelFixtureNames } from "./support/data";

describe("GET /markets/primary/projects/:projectID/listings", () => {
  beforeEach(async () => {
    await loadSequelizeFixtures(
      ModelFixtureNames.COUNTRIES,
      ModelFixtureNames.LOCATIONS,
      ModelFixtureNames.ADDRESSES,
      ModelFixtureNames.AGENTS,
      ModelFixtureNames.USERS,
      ModelFixtureNames.CONTACTS,
      ModelFixtureNames.CATEGORIES,
      ModelFixtureNames.PROJECTS,
      ModelFixtureNames.LISTING_STATUSES,
      ModelFixtureNames.PROJECT_IMAGES,
      ModelFixtureNames.ADDRESSES,
      ModelFixtureNames.LISTINGS,
      ModelFixtureNames.AFFILIATES,
      ModelFixtureNames.AFFILIATE_CONTACTS,
      ModelFixtureNames.AFFILIATE_ASSIGNEES,
      ModelFixtureNames.POTENTIAL_AFFILIATE_VERIFICATION_STATUS,
      ModelFixtureNames.POTENTIAL_AFFILIATES
    );
  });

  it("denies access to unauthenticated requests", async () => {
    const { body, header } = await useRequestFactory()
      .get(`/markets/primary/projects/1/listings`)
      .expect(403);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("returns 400 bad request if the specified ID is not an integer", async () => {
    const { body, header } = await useRequestFactory()
      .withVerifiedUser()
      .get(`/markets/primary/projects/hahanotanint/listings`)
      .expect(400);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  each([
    { minPrice: 1, maxPrice: "yii" },
    { minArea: 1, maxArea: "yaa" },
  ]).it("returns 400 bad request for invalid filter value", async (filters: any) => {
    const { body, header } = await useRequestFactory()
      .withVerifiedUser()
      .get(
        `/markets/primary/projects/hahanotanint/listings?${Object.keys(filters)
          .map((key: string) => `${key}=${filters[key]}`)
          .join("&")}`
      )
      .expect(400);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("only considers valid cateogryIDs in filters", async () => {
    const { body } = await useRequestFactory()
      .withVerifiedUser()
      .get(`/markets/primary/projects/1/listings?categoryIDs=yoo,1`)
      .expect(200);

    expect(body).toHaveLength(1);
    expect(body).toMatchSnapshot();
  });

  it("returns a list of available listings for a project", async () => {
    const { body } = await useRequestFactory()
      .withVerifiedUser()
      .get(`/markets/primary/projects/1/listings`)
      .expect(200);

    expect(body).toHaveLength(2);
    expect(body).toMatchSnapshot();
  });

  it("returns an empty list for a project without listings", async () => {
    const { body } = await useRequestFactory()
      .withVerifiedUser()
      .get(`/markets/primary/projects/3/listings`)
      .expect(200);

    expect(body).toHaveLength(0);
    expect(body).toMatchSnapshot();
  });

  it("returns an empty list for unverified users", async () => {
    const { body } = await useRequestFactory()
      .withUnverifiedUser()
      .get(`/markets/primary/projects/3/listings`)
      .expect(200);

    expect(body).toHaveLength(0);
    expect(body).toMatchSnapshot();
  });
});
