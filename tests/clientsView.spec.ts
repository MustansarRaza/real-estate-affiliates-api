import { SourcePlatform } from "@pf/taxonomies";
import each from "jest-each";
import MockDate from "mockdate";
import { Response } from "supertest";
import { loadSequelizeFixtures, useRequestFactory } from "./support";
import { ModelFixtureConstants, ModelFixtureNames } from "./support/data";

describe("GET /clients", () => {
  beforeEach(async () => {
    await loadSequelizeFixtures(
      ModelFixtureNames.AGENTS,
      ModelFixtureNames.USERS,
      ModelFixtureNames.CONTACTS,
      ModelFixtureNames.AFFILIATES,
      ModelFixtureNames.AFFILIATE_CONTACTS,
      ModelFixtureNames.AFFILIATE_ASSIGNEES,
      ModelFixtureNames.POTENTIAL_AFFILIATE_VERIFICATION_STATUS,
      ModelFixtureNames.POTENTIAL_AFFILIATES,
      ModelFixtureNames.CLIENTS,
      ModelFixtureNames.CLIENT_PHONE_NUMBERS
    );
  });

  it("denies access to unauthenticated requests", async () => {
    const { body, header } = await useRequestFactory()
      .get("/clients")
      .expect(403);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("returns a list of clients for a verified user", async () => {
    const { body, header } = await useRequestFactory()
      .withVerifiedUser()
      .get("/clients")
      .expect(200);

    expect(body).toHaveLength(1);
    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  // Unverified/registered users can't have clients because
  // clients are linked to an affiliate. Only verified users
  // are linked to an affiliate.
  it("returns an empty list for an unverified user", async () => {
    const { body } = await useRequestFactory()
      .withUnverifiedUser()
      .get("/clients")
      .expect(200);

    expect(body).toHaveLength(0);
  });
});

describe("POST /clients", () => {
  const dto = {
    name: "Walt Disney",
    email: "walt@disney.com",
    phoneNumbers: [
      {
        value: "+923214444444",
      },
    ],
    address: "My great street 123",
    locationID: ModelFixtureConstants.lahoreLocationID,
    comment: "this is me",
  };

  const makeRequest = async (params = {}): Promise<Response> =>
    useRequestFactory()
      .withVerifiedUser()
      .post("/clients")
      .send({
        ...dto,
        ...params,
      });

  beforeEach(async () => {
    MockDate.set("2020-03-28T14:12:00.270Z");

    await loadSequelizeFixtures(
      ModelFixtureNames.AGENTS,
      ModelFixtureNames.USERS,
      ModelFixtureNames.CONTACTS,
      ModelFixtureNames.AFFILIATES,
      ModelFixtureNames.AFFILIATE_CONTACTS,
      ModelFixtureNames.POTENTIAL_AFFILIATE_VERIFICATION_STATUS,
      ModelFixtureNames.POTENTIAL_AFFILIATES,
      ModelFixtureNames.AFFILIATE_ASSIGNEES,
      ModelFixtureNames.COUNTRIES,
      ModelFixtureNames.LOCATIONS
    );
  });

  afterEach(() => {
    MockDate.reset();
  });

  it("denies access to unauthenticated requests", async () => {
    const { body, header } = await useRequestFactory()
      .post("/clients")
      .expect(403);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("allows creating a new client and returns 201", async () => {
    const { status, body, header } = await makeRequest();

    expect(status).toBe(201);
    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("does not allow creating duplicate clients and returns 409", async () => {
    await makeRequest();
    const { status, body } = await makeRequest();

    expect(status).toBe(409);
    expect(body).toMatchSnapshot();
  });

  it("does not allow null name", async () => {
    const { status, body } = await makeRequest({
      name: null,
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow empty/whitespace name", async () => {
    const { status, body } = await makeRequest({
      name: " ",
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("trims leading and trailing whitespace from name", async () => {
    const { status, body } = await makeRequest({
      name: " walt disney ",
    });

    expect(status).toBe(201);
    expect(body.name).toBe("walt disney");
  });

  it("removes consecutive spaces from name", async () => {
    const { status, body } = await makeRequest({
      name: "walt   disney",
    });

    expect(status).toBe(201);
    expect(body.name).toBe("walt disney");
  });

  it("does not allow null email", async () => {
    const { status, body } = await makeRequest({
      email: null,
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("trims leading and trailing whitespace from email", async () => {
    const { status, body } = await makeRequest({
      email: " test@test.com ",
    });

    expect(status).toBe(201);
    expect(body.email).toBe("test@test.com");
  });

  it("does not allow invalid e-mail", async () => {
    const { status, body } = await makeRequest({
      email: "hello",
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow null for phone numbers list", async () => {
    const { status, body } = await makeRequest({
      phoneNumbers: null,
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("requires at least one phone number", async () => {
    const { status, body } = await makeRequest({
      phoneNumbers: [],
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("trims leading/trailing whitespace from phone number values", async () => {
    const { status, body } = await makeRequest({
      phoneNumbers: [{ value: " +923214444444 " }],
    });

    expect(status).toBe(201);
    expect(body.phoneNumbers).toHaveLength(1);
    expect(body.phoneNumbers[0].value).toBe("+923214444444");
  });

  it("removes all spaces from phone number values", async () => {
    const { status, body } = await makeRequest({
      phoneNumbers: [{ value: "+923  21 4444444" }],
    });

    expect(status).toBe(201);
    expect(body.phoneNumbers).toHaveLength(1);
    expect(body.phoneNumbers[0].value).toBe("+923214444444");
  });

  it("formats the phone number values to e.164 if possible", async () => {
    const { status, body } = await makeRequest({
      phoneNumbers: [{ value: "+9203214444444" }],
    });

    expect(status).toBe(201);
    expect(body.phoneNumbers).toHaveLength(1);
    expect(body.phoneNumbers[0].value).toBe("+923214444444");
  });

  it("does not allow null for phone number values", async () => {
    const { status, body } = await makeRequest({
      phoneNumbers: [{ value: null }],
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow empty/whitespace for phone number values", async () => {
    const { status, body } = await makeRequest({
      phoneNumbers: [{ value: " " }],
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("allows null address", async () => {
    const { status } = await makeRequest({
      address: null,
    });

    expect(status).toBe(201);
  });

  it("trims leading and trailing whitespace from address", async () => {
    const { status, body } = await makeRequest({
      address: " Strada Great 124 ",
    });

    expect(status).toBe(201);
    expect(body.address).toBe("Strada Great 124");
  });

  it("removes consecutive spaces from address", async () => {
    const { status, body } = await makeRequest({
      address: "Strada Great    124",
    });

    expect(status).toBe(201);
    expect(body.address).toBe("Strada Great 124");
  });

  it("does not allow empty/whitespace address", async () => {
    const { status, body } = await makeRequest({
      address: " ",
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("allows null location id", async () => {
    const { status } = await makeRequest({
      locationID: null,
    });

    expect(status).toBe(201);
  });

  it("only allows integers for location ID", async () => {
    const { status, body } = await makeRequest({
      locationID: 12.4,
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("allows null comment", async () => {
    const { status } = await makeRequest({
      comment: null,
    });

    expect(status).toBe(201);
  });

  it("trims leading and trailing whitespace from comment", async () => {
    const { status, body } = await makeRequest({
      comment: " this is the goodest client ",
    });

    expect(status).toBe(201);
    expect(body.comment).toBe("this is the goodest client");
  });

  it("removes consecutive spaces from comment", async () => {
    const { status, body } = await makeRequest({
      comment: "This is a very   good  client.",
    });

    expect(status).toBe(201);
    expect(body.comment).toBe("This is a very good client.");
  });

  it("allows multi-line comments", async () => {
    const { status, body } = await makeRequest({
      comment: "line1\nline2\nline3",
    });

    expect(status).toBe(201);
    expect(body.comment).toBe("line1\nline2\nline3");
  });

  it("does not allow empty/whitespace comment", async () => {
    const { status, body } = await makeRequest({
      comment: " ",
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not escape html in all text fields", async () => {
    const requestBody = {
      name: '"Hello"',
      address: "Ding & Dong",
      comment: "I'm hello",
    };

    const { status, body } = await makeRequest(requestBody);

    expect(status).toBe(201);
    expect(body.name).toBe(requestBody.name);
    expect(body.address).toBe(requestBody.address);
    expect(body.comment).toBe(requestBody.comment);
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
});
