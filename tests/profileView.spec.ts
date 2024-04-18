import { loadSequelizeFixtures, useRequestFactory } from "./support";
import { ModelFixtureNames } from "./support/data";

describe("/profile", () => {
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

  it("denies access to unauthenticated requests", async () => {
    const { body, header } = await useRequestFactory()
      .get("/profile")
      .expect(403);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("returns the profile", async () => {
    const { body, header } = await useRequestFactory()
      .withVerifiedUser()
      .get("/profile")
      .expect(200);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("returns 404 if no profile could be found for the user", async () => {
    // id of a valid keycloak user, but no profile in the db
    const ssoID = "caf59266-3b27-4e66-a47b-d99a42458b6e";

    const { body } = await useRequestFactory()
      .createUser({ id: ssoID })
      .get("/profile")
      .expect(404);

    expect(body).toMatchSnapshot();
  });
});
