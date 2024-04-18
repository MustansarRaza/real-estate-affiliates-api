import { loadSequelizeFixtures, useRequestFactory } from "./support";
import { ModelFixtureNames } from "./support/data";

describe("/acceptTermsAndConditions", () => {
  beforeEach(async () => {
    await loadSequelizeFixtures(
      ModelFixtureNames.AGENTS,
      ModelFixtureNames.USERS,
      ModelFixtureNames.CONTACTS,
      ModelFixtureNames.AFFILIATES,
      ModelFixtureNames.AFFILIATE_CONTACTS,
      ModelFixtureNames.POTENTIAL_AFFILIATE_VERIFICATION_STATUS,
      ModelFixtureNames.POTENTIAL_AFFILIATES
    );
  });

  it("updates user profile with accepted version of terms and conditions", async () => {
    const { body, header } = await useRequestFactory()
      .withVerifiedUser()
      .post("/acceptTermsAndConditions")
      .send({
        termsAndConditionsVersion: "1.1.1",
      })
      .expect(200);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("returns 404 if no profile could be found for the user", async () => {
    const { body } = await useRequestFactory()
      .withNonExistantUser()
      .post("/acceptTermsAndConditions")
      .send({
        termsAndConditionsVersion: "1.1.1",
      })
      .expect(404);

    expect(body).toMatchSnapshot();
  });
});
