import { loadSequelizeFixtures, useRequestFactory } from "./support";
import { ModelFixtureNames } from "./support/data";

describe("GET /locations", () => {
  beforeEach(async () => {
    await loadSequelizeFixtures(ModelFixtureNames.COUNTRIES, ModelFixtureNames.LOCATIONS);
  });

  it("returns a flat list of locations", async () => {
    const { body, header } = await useRequestFactory()
      .get("/locations")
      .expect(200);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });
});
