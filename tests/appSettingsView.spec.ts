import { loadSequelizeFixtures, useRequestFactory } from "./support";
import { ModelFixtureNames } from "./support/data";

describe("GET /markets/secondary/listings", () => {
  beforeEach(async () => {
    await loadSequelizeFixtures(ModelFixtureNames.APP_RELEASE);
  });

  it("returns current and minimum app version for affiliates app", async () => {
    const { body } = await useRequestFactory()
      .withVerifiedUser()
      .get(`/appRelease`)
      .expect(200);

    expect(body).toMatchSnapshot();
  });
});
