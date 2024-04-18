import { TaskAgainstType } from "affiliates-api/models";
import each from "jest-each";
import { loadSequelizeFixtures, useRequestFactory } from "./support";
import { ModelFixtureNames } from "./support/data";

describe("GET /tasks", () => {
  beforeEach(async () => {
    await loadSequelizeFixtures(
      ModelFixtureNames.AGENTS,
      ModelFixtureNames.USERS,
      ModelFixtureNames.CONTACTS,
      ModelFixtureNames.CATEGORIES,
      ModelFixtureNames.AFFILIATES,
      ModelFixtureNames.AFFILIATE_CONTACTS,
      ModelFixtureNames.POTENTIAL_AFFILIATE_VERIFICATION_STATUS,
      ModelFixtureNames.POTENTIAL_AFFILIATES,
      ModelFixtureNames.CLIENTS,
      ModelFixtureNames.LEAD_STATUSES,
      ModelFixtureNames.LEADS,
      ModelFixtureNames.TASK_TYPES,
      ModelFixtureNames.TASKS
    );
  });

  it("denies access to unauthenticated requests", async () => {
    const { body, header } = await useRequestFactory()
      .get("/tasks")
      .expect(403);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("returns a list of tasks for a verified user", async () => {
    const { body, header } = await useRequestFactory()
      .withVerifiedUser()
      .get("/tasks")
      .expect(200);

    expect(body).toHaveLength(9);
    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  each([
    [TaskAgainstType.AFFILIATE, 1],
    [TaskAgainstType.LEAD, 9],
    [Object.values(TaskAgainstType).join(","), 10],
    [Object.values(TaskAgainstType).join(", "), 10],
  ]).it(
    "accepts %s as againstType query param and returns the tasks as expected",
    async (againstType, expectedTaskCount) => {
      const { body } = await useRequestFactory()
        .withVerifiedUser()
        .get(`/tasks?againstType=${againstType}`)
        .expect(200);

      expect(body).toHaveLength(expectedTaskCount);
      expect(body).toMatchSnapshot();
    }
  );

  each([
    null,
    undefined,
    1,
    "invalid",
    `invalid, ${1}`,
    `invalid, ${TaskAgainstType.LEAD}`,
    `${TaskAgainstType.LEAD},1`,
  ]).it("invalidates %s as againstType query param", async (againstType) => {
    const { body } = await useRequestFactory()
      .withVerifiedUser()
      .get(`/tasks?againstType=${againstType}`)
      .expect(400);

    expect(body).toMatchSnapshot();
  });

  it("returns an empty list for an unverified user", async () => {
    const { body } = await useRequestFactory()
      .withUnverifiedUser()
      .get("/tasks")
      .expect(200);

    expect(body).toHaveLength(0);
  });
});
