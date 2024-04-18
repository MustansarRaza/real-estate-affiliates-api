import { SourcePlatform } from "@pf/taxonomies";
import {
  Client,
  ClientAccessID,
  ClientPhoneNumber,
  ClientReferralType,
  ClientStatusID,
  Country,
  Location,
} from "affiliates-api/models";
import { ClientsService, LocationsService } from "affiliates-api/services";
import { Op } from "sequelize";
import { loadSequelizeFixtures, useMockedServices } from "./support";
import {
  createClient,
  createClientPhoneNumber,
  ModelFixtureConstants,
  ModelFixtureNames,
} from "./support/data";

describe("ClientsService", () => {
  const mockAgencyID = 1337;

  const mockedServices = useMockedServices();
  const service = new ClientsService({ me: mockedServices.me, locations: new LocationsService() });

  beforeEach(async () => {
    jest.resetAllMocks();

    mockedServices.me.owner.mockReturnValue(
      Promise.resolve({
        affiliateID: ModelFixtureConstants.verifiedAffiliateID,
        userID: ModelFixtureConstants.staffUserBDMID,
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      })
    );

    await loadSequelizeFixtures(
      ModelFixtureNames.AGENTS,
      ModelFixtureNames.CONTACTS,
      ModelFixtureNames.AFFILIATES,
      ModelFixtureNames.AFFILIATE_CONTACTS
    );
  });

  describe("list", () => {
    it("only lists active clients", async () => {
      const activeClient = await createClient({
        referralID: ModelFixtureConstants.verifiedAffiliateID,
        statusID: ClientStatusID.ACTIVE,
      });
      await createClient({ statusID: ClientStatusID.DELETED });

      const clients = await service.list({ ssoID: ModelFixtureConstants.verifiedSSOID });

      expect(clients).toHaveLength(1);
      expect(clients[0].id).toBe(activeClient.id);
    });

    it("only lists clients belonging to affiliates", async () => {
      const affiliateClient = await createClient({
        referralID: ModelFixtureConstants.verifiedAffiliateID,
        referralType: ClientReferralType.AFFILIATE,
      });
      await createClient({
        referralID: ModelFixtureConstants.verifiedAffiliateID,
        referralType: ClientReferralType.DIRECT,
      });

      const clients = await service.list({ ssoID: ModelFixtureConstants.verifiedSSOID });

      expect(clients).toHaveLength(1);
      expect(clients[0].id).toBe(affiliateClient.id);
    });

    it("only lists clients belonging to the specified potential affiliate", async () => {
      const myClient = await createClient({
        referralID: ModelFixtureConstants.verifiedAffiliateID,
      });
      await createClient({ referralID: 33 });

      const clients = await service.list({ ssoID: ModelFixtureConstants.verifiedSSOID });

      expect(clients).toHaveLength(1);
      expect(clients[0].id).toBe(myClient.id);
    });

    it("lists phone numbers of the client", async () => {
      const client = await createClient({ referralID: ModelFixtureConstants.verifiedAffiliateID });

      const phoneNumber1 = await ClientPhoneNumber.create({
        clientID: client.id,
        value: "+923212473743",
        shortValue: "212473743",
      });

      const phoneNumber2 = await ClientPhoneNumber.create({
        clientID: client.id,
        value: "+923006666025",
        shortValue: "006666025",
      });

      const clients = await service.list({ ssoID: ModelFixtureConstants.verifiedSSOID });
      expect(clients).toHaveLength(1);
      expect(clients[0].phoneNumbers).toHaveLength(2);

      expect(clients[0].phoneNumbers[0]).toStrictEqual({
        id: phoneNumber1.id,
        value: phoneNumber1.value,
      });

      expect(clients[0].phoneNumbers[1]).toStrictEqual({
        id: phoneNumber2.id,
        value: phoneNumber2.value,
      });
    });
  });

  describe("find", () => {
    it("can find by email and is not case sensitive", async () => {
      const client = await createClient({ email: "tEsT@test.COM" });

      const result = await service.find({ email: "test@tesT.com" });
      expect(result?.id).toBe(client.id);
    });

    it("can find by an E.164 formatted phone number", async () => {
      const client = await createClient();
      await createClientPhoneNumber(client.id, { value: "+923005323674" });

      const result = await service.find({ phoneNumber: "+923005323674" });
      expect(result?.id).toBe(client.id);
    });

    it("raises an error if an invalid number is specified", async () => {
      await expect(service.find({ phoneNumber: "ab" })).rejects.toMatchSnapshot();
    });
  });

  describe("create", () => {
    const createClientBaseDTO = {
      name: "Walt Disney",
      email: "walt@disney.com",
      phoneNumbers: [
        {
          value: "+923214444444",
        },
      ],
      address: null,
      locationID: null,
      comment: "this is me",
      source: SourcePlatform.AFFILIATES_MOBILE_APP,
    };

    it("creates a new client and links it to the right affiliate", async () => {
      const clientDTO = await service.create(
        { ssoID: ModelFixtureConstants.verifiedSSOID },
        createClientBaseDTO
      );

      const client: Client | null = await Client.findOne({
        where: {
          id: {
            [Op.eq]: clientDTO.id,
          },
        },
      });

      expect(client).toBeTruthy();
      expect(client?.id).toBe(clientDTO.id);
      expect(client?.statusID).toBe(ClientStatusID.ACTIVE);
      expect(client?.source).toBe(SourcePlatform.AFFILIATES_MOBILE_APP);
      expect(client?.typeID).toBe(null);
      expect(client?.accessID).toBe(ClientAccessID.UNKNOWN);
      expect(client?.agencyID).toBe(mockAgencyID);
      expect(client?.userID).toBe(ModelFixtureConstants.staffUserBDMID);
      expect(client?.name).toBe(clientDTO.name);
      expect(client?.email).toBe(clientDTO.email);
      expect(client?.address).toBe(clientDTO.address);
      expect(client?.locationID).toBe(clientDTO.locationID);
      expect(client?.countryID).toBe(null);
      expect(client?.phoneNumber).toBe(null);
      expect(client?.comment).toBe(clientDTO.comment);
      expect(client?.referralType).toBe(ClientReferralType.AFFILIATE);
      expect(client?.referralID).toBe(ModelFixtureConstants.verifiedAffiliateID);
      expect(client?.createdAt).toBeTruthy();
      expect(client?.updatedAt).toBeTruthy();
    });

    it("creates a ClientPhoneNumber as expected", async () => {
      const clientDTO = await service.create(
        { ssoID: ModelFixtureConstants.verifiedSSOID },
        createClientBaseDTO
      );

      const phoneNumber = await ClientPhoneNumber.findOne({
        where: {
          clientID: {
            [Op.eq]: clientDTO.id,
          },
        },
      });

      expect(phoneNumber).toBeTruthy();
      expect(phoneNumber?.value).toBe(clientDTO.phoneNumbers[0].value);
      expect(phoneNumber?.shortValue).toBe(clientDTO.phoneNumbers[0].value.slice(-9));
    });

    it("looks up the country ID for the specified location ID and stores it", async () => {
      const country = await Country.create({
        name: "Pakistan",
      });

      const location = await Location.create({
        name: "Lahore",
        level: 1,
        countryID: country.id,
      });

      const clientDTO = await service.create(
        { ssoID: ModelFixtureConstants.verifiedSSOID },
        {
          ...createClientBaseDTO,
          locationID: location.id,
        }
      );

      const client: Client | null = await Client.findOne({
        where: {
          id: {
            [Op.eq]: clientDTO.id,
          },
        },
      });

      expect(client?.countryID).toBe(country.id);
      expect(client?.locationID).toBe(location.id);
    });

    it("does not allow creating clients without having an owner", async () => {
      mockedServices.me.owner.mockReturnValue(Promise.resolve(null));

      await expect(
        service.create({ ssoID: ModelFixtureConstants.verifiedSSOID }, createClientBaseDTO)
      ).rejects.toMatchSnapshot();
    });

    it("allows creating clients with the same name", async () => {
      const client1 = await createClient({ name: "Walt Disney" });

      const client2 = await service.create(
        { ssoID: ModelFixtureConstants.verifiedSSOID },
        {
          ...createClientBaseDTO,
          name: "Walt Disney",
        }
      );

      expect(client1.id).not.toBe(client2.id);
    });

    it("does not allow creating clients with the same cell number", async () => {
      const client = await createClient();
      await createClientPhoneNumber(client.id, { value: "+923214444444" });

      await expect(
        service.create(
          { ssoID: ModelFixtureConstants.verifiedSSOID },
          {
            ...createClientBaseDTO,
            phoneNumbers: [
              {
                value: "+923214444444",
              },
            ],
          }
        )
      ).rejects.toMatchSnapshot();
    });

    it("does not allow creating clients with the same email address", async () => {
      await createClient({ email: "cookies@monster.com" });

      await expect(
        service.create(
          { ssoID: ModelFixtureConstants.verifiedSSOID },
          {
            ...createClientBaseDTO,
            email: "cookies@monster.com",
          }
        )
      ).rejects.toMatchSnapshot();
    });

    it("does not allow creating clients with an invalid location ID", async () => {
      await expect(
        service.create(
          { ssoID: ModelFixtureConstants.verifiedSSOID },
          {
            ...createClientBaseDTO,
            locationID: 9999,
          }
        )
      ).rejects.toMatchSnapshot();
    });
  });
});
