import { loadSequelizeFixtures, useRequestFactory } from "./support";
import { ModelFixtureNames } from "./support/data";

describe("GET /leads/summary", () => {
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
      .get("/leads/summary?fromDate=2020-01-01T00:00:00Z&toDate=2021-04-15T00:00:00Z")
      .expect(403);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("returns leads summary for a verified user", async () => {
    const { body, header } = await useRequestFactory()
      .withVerifiedUser()
      .get("/leads/summary?fromDate=2021-01-01T00:00:00Z&toDate=2021-04-15T00:00:00Z")
      .expect(200);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("returns an empty summary object for an unverified user", async () => {
    const { body } = await useRequestFactory()
      .withUnverifiedUser()
      .get("/leads/summary?fromDate=2021-01-01T00:00:00Z&toDate=2021-04-15T00:00:00Z")
      .expect(200);

    expect(body).toMatchObject({
      active: 0,
      inactive: 0,
      tokenGenerated: 0,
      closedWon: 0,
      downPayment: 0,
    });
  });

  [
    "",
    "fromDate=2021-01-01T00:00:00Z",
    "toDate=2021-04-15T00:00:00Z",
    "fromDate=2021-01-01T00:00:00Z&toDate=2021-04-15T00:00:00Z",
  ].forEach((queryParams) => {
    it(`accepts "${queryParams}" as date range if the provided date is ISO8601 date and returns the leadsSummary as per the provided query params`, async () => {
      const { body } = await useRequestFactory()
        .withVerifiedUser()
        .get(`/leads/summary?${queryParams}`)
        .expect(200);

      expect(body).toMatchSnapshot();
    });
  });

  ["fromDate=true", "fromDate=156", "toDate=helloworld", "fromDate=null&toDate=undefined"].forEach(
    (queryParams) => {
      it(`throws Bad Request for the date range = "${queryParams}" since the provided date is not ISO8601 date`, async () => {
        const { body } = await useRequestFactory()
          .withVerifiedUser()
          .get(`/leads/summary?${queryParams}`)
          .expect(400);

        expect(body).toMatchSnapshot();
      });
    }
  );
});
