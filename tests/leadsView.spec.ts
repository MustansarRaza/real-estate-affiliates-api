import { SourcePlatform } from "@pf/taxonomies";
import {
  LeadClassification,
  LeadInquiryBudgetCurrency,
  LeadInquiryObjectType,
  LeadMarket,
  LeadSide,
  Purpose,
} from "affiliates-api/models";
import each from "jest-each";
import MockDate from "mockdate";
import { Response } from "supertest";
import { loadSequelizeFixtures, useRequestFactory } from "./support";
import { ModelFixtureConstants, ModelFixtureNames } from "./support/data";

describe("GET /leads", () => {
  beforeEach(async () => {
    await loadSequelizeFixtures(
      ModelFixtureNames.AGENTS,
      ModelFixtureNames.USERS,
      ModelFixtureNames.DESIGNATIONS,
      ModelFixtureNames.CONTACTS,
      ModelFixtureNames.CATEGORIES,
      ModelFixtureNames.COUNTRIES,
      ModelFixtureNames.LOCATIONS,
      ModelFixtureNames.AFFILIATES,
      ModelFixtureNames.AFFILIATE_CONTACTS,
      ModelFixtureNames.POTENTIAL_AFFILIATE_VERIFICATION_STATUS,
      ModelFixtureNames.POTENTIAL_AFFILIATES,
      ModelFixtureNames.CLIENTS,
      ModelFixtureNames.LEAD_STATUSES,
      ModelFixtureNames.LEADS,
      ModelFixtureNames.LEAD_LOCATIONS,
      ModelFixtureNames.TASK_TYPES,
      ModelFixtureNames.TASKS
    );
  });

  it("denies access to unauthenticated requests", async () => {
    const { body, header } = await useRequestFactory()
      .get("/leads")
      .expect(403);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("returns a list of leads for a verified user", async () => {
    const { body, header } = await useRequestFactory()
      .withVerifiedUser()
      .get("/leads")
      .expect(200);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();

    expect(body).toHaveLength(4);

    expect(body[0].id).toBe(3);
    expect(body[0].clientID).toBe(1);
    expect(body[0].status.id).toBe(18);
    expect(body[0].status.title).toBe("Site Office");
    expect(body[0].side).toBe("demand");
    expect(body[0].market).toBe("primary");
    expect(body[0].classification).toBe("moderate");
    expect(body[0].inquiry.object.type).toBe("project");
    expect(body[0].inquiry.object.id).toBe(3);
    expect(body[0].inquiry.purpose).toBe("for-sale");
    expect(body[0].inquiry.categoryID).toBe(2);
    expect(body[0].inquiry.locationIDs).toEqual([3]);
    expect(body[0].inquiry.budget.amount).toBe(500000);
    expect(body[0].inquiry.budget.currency).toBe("PKR");
    expect(body[0].inquiry.bedroomCount).toBe(3);
    expect(body[0].inquiry.bathroomCount).toBe(null);
    expect(body[0].updatedAt).toBe("2020-03-13T11:20:00.000Z");
    expect(body[0].createdAt).toBe("2020-03-13T11:20:00.000Z");
    expect(body[0].lastTask.id).toBe(8);
    expect(body[0].lastTask.title).toBe(null);
    expect(body[0].lastTask.dateAdded).toBe("2020-03-12T11:38:40.000Z");
    expect(body[0].lastTask.taskType.id).toBe(3);
    expect(body[0].lastTask.taskType.title).toBe("Meeting (Arrange)");
    expect(body[0].lastTask.taskType.parent.id).toBe(62);
    expect(body[0].lastTask.taskType.parent.title).toBe("Meetings");

    expect(body[1].id).toBe(5);
    expect(body[1].clientID).toBe(1);
    expect(body[1].status.id).toBe(6);
    expect(body[1].status.title).toBe("Closed (Won)");
    expect(body[1].side).toBe("demand");
    expect(body[1].market).toBe("primary");
    expect(body[1].classification).toBe("veryHot");
    expect(body[1].inquiry.object.type).toBe("project");
    expect(body[1].inquiry.object.id).toBe(1);
    expect(body[1].inquiry.purpose).toBe("for-sale");
    expect(body[1].inquiry.categoryID).toBe(4);
    expect(body[1].inquiry.locationIDs).toEqual([]);
    expect(body[1].inquiry.budget).toBe(null);
    expect(body[1].inquiry.bedroomCount).toBe(2);
    expect(body[1].inquiry.bathroomCount).toBe(1);
    expect(body[1].updatedAt).toBe("2020-04-10T11:21:00.000Z");
    expect(body[1].createdAt).toBe("2020-03-11T09:19:40.000Z");
    expect(body[1].lastTask.id).toBe(12);
    expect(body[1].lastTask.title).toBe(null);
    expect(body[1].lastTask.dateAdded).toBe("2021-04-10T00:00:40.000Z");
    expect(body[1].lastTask.taskType.id).toBe(52);
    expect(body[1].lastTask.taskType.title).toBe("Closed (Won)");
    expect(body[1].lastTask.taskType.parent.id).toBe(56);
    expect(body[1].lastTask.taskType.parent.title).toBe("Sales");

    expect(body[2].id).toBe(1);
    expect(body[2].clientID).toBe(1);
    expect(body[2].status.id).toBe(9);
    expect(body[2].status.title).toBe("Token Received");
    expect(body[2].side).toBe("demand");
    expect(body[2].market).toBe("primary");
    expect(body[2].classification).toBe("veryHot");
    expect(body[2].inquiry.object.type).toBe("project");
    expect(body[2].inquiry.object.id).toBe(1);
    expect(body[2].inquiry.purpose).toBe("for-sale");
    expect(body[2].inquiry.categoryID).toBe(4);
    expect(body[2].inquiry.locationIDs).toEqual([1, 3]);
    expect(body[2].inquiry.budget).toBe(null);
    expect(body[2].inquiry.bedroomCount).toBe(2);
    expect(body[2].inquiry.bathroomCount).toBe(1);
    expect(body[2].updatedAt).toBe("2020-03-12T11:21:00.000Z");
    expect(body[2].createdAt).toBe("2020-03-11T09:19:40.000Z");
    expect(body[2].lastTask.id).toBe(5);
    expect(body[2].lastTask.title).toBe(null);
    expect(body[2].lastTask.dateAdded).toBe("2020-03-15T11:32:00.000Z");
    expect(body[2].lastTask.taskType.id).toBe(6);
    expect(body[2].lastTask.taskType.title).toBe("Token Received");
    expect(body[2].lastTask.taskType.parent.id).toBe(63);
    expect(body[2].lastTask.taskType.parent.title).toBe("Sales");

    expect(body[3].id).toBe(2);
    expect(body[3].clientID).toBe(1);
    expect(body[3].status.id).toBe(1);
    expect(body[3].status.title).toBe("New");
    expect(body[3].side).toBe("demand");
    expect(body[3].market).toBe("primary");
    expect(body[3].classification).toBe("veryHot");
    expect(body[3].inquiry.object.type).toBe("project");
    expect(body[3].inquiry.object.id).toBe(1);
    expect(body[3].inquiry.purpose).toBe("for-sale");
    expect(body[3].inquiry.categoryID).toBe(3);
    expect(body[3].inquiry.locationIDs).toEqual([]);
    expect(body[3].inquiry.budget).toBe(null);
    expect(body[3].inquiry.bedroomCount).toBe(2);
    expect(body[3].inquiry.bathroomCount).toBe(1);
    expect(body[3].updatedAt).toBe("2020-03-11T21:45:00.000Z");
    expect(body[3].createdAt).toBe("2020-03-10T09:19:40.000Z");
    expect(body[3].lastTask).toBe(null);
  });

  it("returns an empty list for an unverified user", async () => {
    const { body } = await useRequestFactory()
      .withUnverifiedUser()
      .get("/leads")
      .expect(200);

    expect(body).toHaveLength(0);
  });
});

describe("POST /leads", () => {
  const dto = {
    clientID: ModelFixtureConstants.activeAffiliateClientID,
    side: LeadSide.DEMAND,
    market: LeadMarket.PRIMARY,
    classification: LeadClassification.MODERATE,
    inquiry: {
      object: {
        type: LeadInquiryObjectType.PROJECT,
        id: 1,
      },
      purpose: Purpose.FOR_SALE,
      categoryID: 1,
      locationIDs: [3],
      budget: {
        amount: 5000,
        currency: LeadInquiryBudgetCurrency.EUR,
      },
      bedroomCount: 3,
      bathroomCount: 2,
    },
  };

  const makeRequest = async (params = {}): Promise<Response> =>
    useRequestFactory()
      .withVerifiedUser()
      .post("/leads")
      .send({
        ...dto,
        ...params,
      });

  beforeEach(async () => {
    MockDate.set("2020-03-28T14:12:00.270Z");

    await loadSequelizeFixtures(
      ModelFixtureNames.AGENTS,
      ModelFixtureNames.USERS,
      ModelFixtureNames.DESIGNATIONS,
      ModelFixtureNames.CATEGORIES,
      ModelFixtureNames.COUNTRIES,
      ModelFixtureNames.LOCATIONS,
      ModelFixtureNames.AFFILIATES,
      ModelFixtureNames.AFFILIATE_CONTACTS,
      ModelFixtureNames.AFFILIATE_ASSIGNEES,
      ModelFixtureNames.POTENTIAL_AFFILIATE_VERIFICATION_STATUS,
      ModelFixtureNames.POTENTIAL_AFFILIATES,
      ModelFixtureNames.CLIENTS,
      ModelFixtureNames.LEAD_STATUSES
    );
  });

  afterEach(() => {
    MockDate.reset();
  });

  it("denies access to unauthenticated requests", async () => {
    const { body, header } = await useRequestFactory()
      .post("/leads")
      .expect(403);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("allows creating a new lead and returns 201", async () => {
    const { status, body, header } = await makeRequest();

    expect(status).toBe(201);
    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("does not allow null client ID", async () => {
    const { status, body } = await makeRequest({ clientID: null });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow non-int client ID", async () => {
    const { status, body } = await makeRequest({ clientID: "bla" });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  Object.values(LeadSide).forEach((side) => {
    it(`allows '${side}' as a valid lead side`, async () => {
      const { status } = await makeRequest({ side });
      expect(status).toBe(201);
    });
  });

  it("does not allow null lead side", async () => {
    const { status, body } = await makeRequest({ side: null });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow invalid lead side", async () => {
    const { status, body } = await makeRequest({ side: "bla" });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  Object.values(LeadMarket).forEach((market) => {
    it(`allows '${market}' as a valid market`, async () => {
      const { status } = await makeRequest({ market });
      expect(status).toBe(201);
    });
  });

  it("does not allow null market", async () => {
    const { status, body } = await makeRequest({ market: null });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow invalid market", async () => {
    const { status, body } = await makeRequest({ market: "bla" });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  Object.values(LeadClassification).forEach((classification) => {
    it(`allows '${classification}' as a valid classification`, async () => {
      const { status } = await makeRequest({ classification });
      expect(status).toBe(201);
    });
  });

  it("allows null classification", async () => {
    const { status } = await makeRequest({ classification: null });
    expect(status).toBe(201);
  });

  it("does not allow invalid classification", async () => {
    const { status, body } = await makeRequest({ classification: "bla" });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("allows null inquiry object", async () => {
    const { status } = await makeRequest({
      inquiry: { ...dto.inquiry, object: null },
    });

    expect(status).toBe(201);
  });

  Object.values(LeadInquiryObjectType).forEach((objectType) => {
    it(`allows '${objectType}' as a inquiry object type`, async () => {
      const { status } = await makeRequest({
        inquiry: { ...dto.inquiry, object: { ...dto.inquiry.object, type: objectType } },
      });
      expect(status).toBe(201);
    });
  });

  it("does not allow null inquiry object type", async () => {
    const { status, body } = await makeRequest({
      inquiry: { ...dto.inquiry, object: { ...dto.inquiry.object, type: null } },
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow invalid inquiry object type", async () => {
    const { status, body } = await makeRequest({
      inquiry: { ...dto.inquiry, object: { ...dto.inquiry.object, type: "bla" } },
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow null inquiry object ID", async () => {
    const { status, body } = await makeRequest({
      inquiry: { ...dto.inquiry, object: { ...dto.inquiry.object, id: null } },
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow non-int inquiry object ID", async () => {
    const { status, body } = await makeRequest({
      inquiry: { ...dto.inquiry, object: { ...dto.inquiry.object, id: "bla" } },
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  Object.values(Purpose).forEach((purpose) => {
    it(`allows '${purpose}' as a valid purpose`, async () => {
      const { status } = await makeRequest({ inquiry: { ...dto.inquiry, purpose } });
      expect(status).toBe(201);
    });
  });

  it("allows null purpose", async () => {
    const { status } = await makeRequest({ inquiry: { ...dto.inquiry, purpose: null } });
    expect(status).toBe(201);
  });

  it("does not allow invalid purpose", async () => {
    const { status, body } = await makeRequest({ inquiry: { ...dto.inquiry, purpose: "bla" } });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("allows null category ID", async () => {
    const { status } = await makeRequest({ inquiry: { ...dto.inquiry, categoryID: null } });
    expect(status).toBe(201);
  });

  it("allows zero location ID's", async () => {
    const { status } = await makeRequest({ inquiry: { ...dto.inquiry, locationIDs: [] } });

    expect(status).toBe(201);
  });

  it("does not allow non-int category ID", async () => {
    const { status, body } = await makeRequest({ inquiry: { ...dto.inquiry, categoryID: "bla" } });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow null location ID's", async () => {
    const { status, body } = await makeRequest({ inquiry: { ...dto.inquiry, locationIDs: null } });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow non-int location ID's", async () => {
    const { status, body } = await makeRequest({
      inquiry: { ...dto.inquiry, locationIDs: ["booyah"] },
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("allows null bedroom count", async () => {
    const { status } = await makeRequest({ inquiry: { ...dto.inquiry, bedroomCount: null } });
    expect(status).toBe(201);
  });

  it("allows zero bedroom count", async () => {
    const { status } = await makeRequest({ inquiry: { ...dto.inquiry, bedroomCount: 0 } });
    expect(status).toBe(201);
  });

  it("does not allow non-int bedroom count", async () => {
    const { status, body } = await makeRequest({
      inquiry: { ...dto.inquiry, bedroomCount: "bla" },
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow negative bedroom count", async () => {
    const { status, body } = await makeRequest({ inquiry: { ...dto.inquiry, bedroomCount: -2 } });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow more than 775 for bedroom count", async () => {
    const { status, body } = await makeRequest({ inquiry: { ...dto.inquiry, bedroomCount: 800 } });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("allows null bathroom count", async () => {
    const { status } = await makeRequest({ inquiry: { ...dto.inquiry, bathroomCount: null } });
    expect(status).toBe(201);
  });

  it("allows zero bathroom count", async () => {
    const { status } = await makeRequest({ inquiry: { ...dto.inquiry, bathroomCount: 0 } });
    expect(status).toBe(201);
  });

  it("does not allow non-int bathroom count", async () => {
    const { status, body } = await makeRequest({
      inquiry: { ...dto.inquiry, bathroomCount: "bla" },
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow negative bathroom count", async () => {
    const { status, body } = await makeRequest({ inquiry: { ...dto.inquiry, bathroomCount: -2 } });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow more than 80 for bathroom count", async () => {
    const { status, body } = await makeRequest({ inquiry: { ...dto.inquiry, bathroomCount: 90 } });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("allows null budget", async () => {
    const { status } = await makeRequest({ inquiry: { ...dto.inquiry, budget: null } });
    expect(status).toBe(201);
  });

  it("does not allow an invalid budget", async () => {
    const { status, body } = await makeRequest({ inquiry: { ...dto.inquiry, budget: "b;a" } });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow a null budget currency", async () => {
    const { status, body } = await makeRequest({
      inquiry: { ...dto.inquiry, budget: { ...dto.inquiry.budget, currency: null } },
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow an invalid budget currency", async () => {
    const { status, body } = await makeRequest({
      inquiry: { ...dto.inquiry, budget: { ...dto.inquiry.budget, currency: "bla" } },
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  Object.values(LeadInquiryBudgetCurrency).forEach((currency) => {
    it(`allows '${currency}' as a valid budget currency`, async () => {
      const { status } = await makeRequest({
        inquiry: { ...dto.inquiry, budget: { ...dto.inquiry.budget, currency } },
      });
      expect(status).toBe(201);
    });
  });

  it("does not allow a null budget amount", async () => {
    const { status, body } = await makeRequest({
      inquiry: { ...dto.inquiry, budget: { ...dto.inquiry.budget, amount: null } },
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow a invalid budget amount", async () => {
    const { status, body } = await makeRequest({
      inquiry: { ...dto.inquiry, budget: { ...dto.inquiry.budget, amount: "bla" } },
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("allows a valid decimal number for the budget amount", async () => {
    const { status } = await makeRequest({
      inquiry: { ...dto.inquiry, budget: { ...dto.inquiry.budget, amount: 12.5 } },
    });
    expect(status).toBe(201);
  });

  it("does not allow an invalid source", async () => {
    const { status, body } = await makeRequest({
      source: "invalidSource",
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  each([...Object.values(SourcePlatform), undefined]).it(
    `allows %s as a valid source`,
    async (source?: SourcePlatform) => {
      const { status } = await makeRequest({ source });
      expect(status).toBe(201);
    }
  );

  each(["test string", null, undefined]).it(
    "allows %s as valid unit number",
    async (unitNumber) => {
      const { status } = await makeRequest({ inquiry: { ...dto.inquiry, unitNumber } });
      expect(status).toBe(201);
    }
  );
});
