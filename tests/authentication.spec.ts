import { useRequestFactory } from "./support";

describe("authentication", () => {
  it("returns 403 if no authorization header is specified", async () => {
    await useRequestFactory()
      .get("/me")
      .expect(403);
  });

  it("returns 403 if an empty authorization header is specified", async () => {
    await useRequestFactory()
      .get("/me")
      .set("Authorization", "")
      .expect(403);
  });

  it("returns 403 if an invalid token type is specified", async () => {
    await useRequestFactory()
      .get("/me")
      .set("Authorization", "Basic test")
      .expect(403);
  });

  it("returns 403 if an invalid token is specified", async () => {
    await useRequestFactory()
      .get("/me")
      .set("Authorization", "Bearer test")
      .expect(403);
  });

  it("returns 403 if an expired token is specified", async () => {
    const factory = useRequestFactory();

    const user = factory.kmock.database.createUser();
    const token = factory.kmock.createBearerToken(user.profile.id, -10);

    await factory
      .get("/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });

  it("returns a non-access denied error if a valid token is specified", async () => {
    await useRequestFactory()
      .withVerifiedUser()
      .get("/me")
      // returns 404 because the user is not an affiliate
      .expect(404);
  });
});
