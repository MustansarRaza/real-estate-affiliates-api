import { loadSequelizeFixtures, useRequestFactory } from "./support";
import { ModelFixtureNames } from "./support/data";

describe("GET /categories", () => {
  beforeEach(async () => {
    await loadSequelizeFixtures(
      ModelFixtureNames.COUNTRIES,
      ModelFixtureNames.LOCATIONS,
      ModelFixtureNames.ADDRESSES,
      ModelFixtureNames.CATEGORIES,
      ModelFixtureNames.PROJECTS,
      ModelFixtureNames.LISTING_STATUSES,
      ModelFixtureNames.LISTINGS,
      ModelFixtureNames.PLATFORM
    );
  });

  it("returns a flat list of categories. The cities and project ids from all agencies that are avialable in a category are also listed within it", async () => {
    const { body, header } = await useRequestFactory()
      .get("/categories")
      .expect(200);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("returns a flat list of categories. The cities and project ids from agency `1337` that are avialable in a category are also listed within it", async () => {
    const { body, header } = await useRequestFactory()
      .get("/categories/1337")
      .expect(200);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("returns 400 bad request if the specified agencyID is not an integer", async () => {
    const { body, header } = await useRequestFactory()
      .get("/categories/newCat")
      .expect(400);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });
});
