import { AffiliateAppSourceType } from "@pf/taxonomies";
import { AppError } from "@pf/utils";
import {
  Affiliate,
  AffiliateContact,
  AffiliateContactCell,
  AffiliatePlatform,
  AffiliatePlatformID,
  AffiliateType,
  AffiliateTypeID,
  Agent,
  Contact,
  GovIDType,
  PotentialAffiliate,
  PotentialAffiliateStatus,
  PotentialAffiliateVerificationStatusID,
} from "affiliates-api/models";
import { ProfileService } from "affiliates-api/services";
import faker from "faker";
import each from "jest-each";
import MockDate from "mockdate";
import { Op } from "sequelize";
import { loadSequelizeFixtures, useMockedServices } from "./support";
import { createPotentialAffiliate, ModelFixtureNames } from "./support/data";

describe("ProfileService", () => {
  const mockedServices = useMockedServices();
  const service = new ProfileService(mockedServices);

  beforeAll(() => {
    MockDate.set("2020-12-17 14:36:06");
  });

  beforeEach(async () => {
    await loadSequelizeFixtures(ModelFixtureNames.POTENTIAL_AFFILIATE_VERIFICATION_STATUS);
  });

  afterAll(() => {
    MockDate.reset();
  });

  const getOrFindAndCatch = async (
    method: "get" | "find",
    ssoID: string
  ): Promise<AppError | null> => {
    let caughtError: AppError | null = null;
    try {
      await service[method]({ ssoID });
    } catch (error) {
      caughtError = error;
    }

    return caughtError;
  };

  const contactData = {
    email: "test@test.com",
    firstName: "test",
    lastName: "other",
    mobile: "+923377178218",
    phone: "+922123569856",
    address: "my happy street 12",
    idType: "NIC",
    idNumber: "128738934",
    ntn: "238928323",
    businessName: "My business",
    affiliateType: "1",
    cityId: "3",
  };

  const deviceData = {
    deviceType: "Mobile-Samsung s10",
    ipAddress: "211.208.0.11",
    macAddress: "00:A0:C9:14:C8:29",
    osVersion: "Android-10",
  };

  each(["get", "find"]).describe("%s", (method: "get" | "find") => {
    it("can get a full profile if there is no deviceData", async () => {
      const ssoID = faker.random.uuid();

      await createPotentialAffiliate(ssoID, { contactData });
      const profile = await service[method]({ ssoID });

      expect(profile?.email).toBe(contactData.email);
      expect(profile?.username).toBe(contactData.email);
      expect(profile?.givenName).toBe(contactData.firstName);
      expect(profile?.familyName).toBe(contactData.lastName);
      expect(profile?.mobilePhoneNumbers).toStrictEqual([contactData.mobile]);
      expect(profile?.landLinePhoneNumbers).toStrictEqual([contactData.phone]);
      expect(profile?.address).toBe(contactData.address);
      expect(profile?.govIDType).toBe(contactData.idType);
      expect(profile?.govIDNumber).toBe(contactData.idNumber);
      expect(profile?.taxNumber).toBe(contactData.ntn);
      expect(profile?.businessName).toBe(contactData.businessName);
      expect(profile?.affiliateType).toBe(AffiliateType.AGENCY);
      expect(profile?.locationID).toBe(3);
    });

    it("can get a full profile if there exists deviceData", async () => {
      const ssoID = faker.random.uuid();

      await createPotentialAffiliate(ssoID, { contactData, deviceData });
      const profile = await service[method]({ ssoID });

      expect(profile?.email).toBe(contactData.email);
      expect(profile?.username).toBe(contactData.email);
      expect(profile?.givenName).toBe(contactData.firstName);
      expect(profile?.familyName).toBe(contactData.lastName);
      expect(profile?.mobilePhoneNumbers).toStrictEqual([contactData.mobile]);
      expect(profile?.landLinePhoneNumbers).toStrictEqual([contactData.phone]);
      expect(profile?.address).toBe(contactData.address);
      expect(profile?.govIDType).toBe(contactData.idType);
      expect(profile?.govIDNumber).toBe(contactData.idNumber);
      expect(profile?.taxNumber).toBe(contactData.ntn);
      expect(profile?.businessName).toBe(contactData.businessName);
      expect(profile?.affiliateType).toBe(AffiliateType.AGENCY);
      expect(profile?.locationID).toBe(3);
      expect(profile?.deviceType).toBe(deviceData.deviceType);
    });

    each([
      [AffiliateTypeID.AGENCY, AffiliateType.AGENCY],
      [AffiliateTypeID.INDIVIDUAL, AffiliateType.INDIVIDUAL],
      [AffiliateTypeID.BROKER, AffiliateType.BROKER],
      [AffiliateTypeID.AGENT, AffiliateType.AGENT],
      [AffiliateTypeID.TITANIUM_AGENCY, AffiliateType.TITANIUM_AGENCY],
      [99, null],
      [null, null],
      [undefined, null],
    ]).it(`properly converts affiliateTypeID %d from an ID to %s`, async (id, value) => {
      const ssoID = faker.random.uuid();

      const contactData = {
        email: "test@test.com",
        firstName: "test",
        lastName: "other",
        affiliateType: id ? id.toString() : id,
      };

      await createPotentialAffiliate(ssoID, { contactData });
      const profile = await service[method]({ ssoID });

      expect(profile?.affiliateType).toBe(value);
    });

    it(`properly return null for the location id if City Id provided is not number convertible`, async () => {
      const ssoID = faker.random.uuid();

      await createPotentialAffiliate(ssoID, { contactData: { ...contactData, cityId: "Lahore" } });
      const profile = await service[method]({ ssoID });

      expect(profile?.locationID).toBe(null);
    });

    it("can get a profile with only email, firstName and lastName", async () => {
      const ssoID = faker.random.uuid();

      const contactData = { email: "test@test.com", firstName: "test", lastName: "other" };

      await createPotentialAffiliate(ssoID, { contactData });
      const profile = await service[method]({ ssoID });

      expect(profile?.email).toBe(contactData.email);
      expect(profile?.username).toBe(contactData.email);
      expect(profile?.givenName).toBe(contactData.firstName);
      expect(profile?.familyName).toBe(contactData.lastName);
      expect(profile?.mobilePhoneNumbers).toHaveLength(0);
      expect(profile?.landLinePhoneNumbers).toHaveLength(0);
      expect(profile?.address).toBe(null);
      expect(profile?.govIDType).toBe(null);
      expect(profile?.govIDNumber).toBe(null);
      expect(profile?.taxNumber).toBe(null);
      expect(profile?.businessName).toBe(null);
      expect(profile?.affiliateType).toBe(null);
      expect(profile?.locationID).toBe(null);
    });

    it("properly gets a profile by username", async () => {
      const ssoID = faker.random.uuid();

      const contactData = { email: "test@test.com", firstName: "test", lastName: "other" };

      await createPotentialAffiliate(ssoID, { contactData });
      const profile = await service[method]({ username: contactData.email });

      expect(profile?.email).toBe(contactData.email);
    });

    it("properly gets a profile by mobile phone numbers", async () => {
      const ssoID = faker.random.uuid();

      const contactData = {
        email: "test@test.com",
        firstName: "test",
        lastName: "other",
        mobile: "+923377178218",
      };

      await createPotentialAffiliate(ssoID, { contactData });
      const profile = await service[method]({
        mobilePhoneNumbers: ["+922123569856", "+923377178218"],
      });

      expect(profile?.mobilePhoneNumbers[0]).toEqual(contactData.mobile);
    });

    it("properly gets a profile by email if mobile phone number does not match", async () => {
      const ssoID = faker.random.uuid();

      const contactData = {
        email: "test@test.com",
        firstName: "test",
        lastName: "other",
        mobile: "+923377178218",
      };

      await createPotentialAffiliate(ssoID, { contactData });
      const profile = await service[method]({
        username: "test@test.com",
        mobilePhoneNumbers: ["+922123569856", "+923377178218"],
      });

      expect(profile?.email).toBe(contactData.email);
    });

    it("throws an error if there is no contact data", async () => {
      const ssoID = "572fabcd-db43-463a-9eef-8abe0530734e";

      await createPotentialAffiliate(ssoID, { contactData: null });
      const caughtError = await getOrFindAndCatch(method, ssoID);

      expect(caughtError).toMatchSnapshot();
    });

    it("throws an error if the contact data is not a JSON object", async () => {
      const ssoID = "bdc64097-249a-479c-a38c-79aac73a4a5b";

      await createPotentialAffiliate(ssoID, { contactData: "test" });
      const caughtError = await getOrFindAndCatch(method, ssoID);

      expect(caughtError).toMatchSnapshot();
    });

    it("throws an error if the device data is not a JSON object", async () => {
      const ssoID = "bdc64097-249a-479c-a38c-79aac73a4a5b";

      await createPotentialAffiliate(ssoID, { contactData, deviceData: "test" });
      const caughtError = await getOrFindAndCatch(method, ssoID);

      expect(caughtError).toMatchSnapshot();
    });

    [
      {},
      {
        ipAddress: "211.208.0.11",
        macAddress: "00:A0:C9:14:C8:29",
        osVersion: "Android-10",
      },
      {
        deviceType: "Mobile-Samsung s10",
        macAddress: "00:A0:C9:14:C8:29",
        osVersion: "Android-10",
      },
      {
        deviceType: "Mobile-Samsung s10",
        ipAddress: "211.208.0.11",
        osVersion: "Android-10",
      },
      {
        deviceType: "Mobile-Samsung s10",
        ipAddress: "211.208.0.11",
        macAddress: "00:A0:C9:14:C8:29",
      },
    ].forEach((deviceDataValue) => {
      it("throws an error if the device data is missing any of the mandatory field", async () => {
        const ssoID = "bdc64097-249a-479c-a38c-79aac73a4a5b";

        await createPotentialAffiliate(ssoID, { contactData, deviceData: deviceDataValue });
        const caughtError = await getOrFindAndCatch(method, ssoID);

        expect(caughtError).toMatchSnapshot();
      });
    });

    it("throws an error if the contact data is missing email, firstName and lastName", async () => {
      const ssoID = "06d4f2fd-9bc4-4e3f-9a04-3841fd4216a0";

      await createPotentialAffiliate(ssoID, { contactData: {} });
      const caughtError = await getOrFindAndCatch(method, ssoID);

      expect(caughtError).toMatchSnapshot();
    });

    if (method === "get") {
      it("throws an error if there is no matching potential affiliate", async () => {
        const ssoID = "3a5cdc4a-7b71-497d-9f57-62a8f611376f";
        const caughtError = await getOrFindAndCatch(method, ssoID);

        expect(caughtError).toMatchSnapshot();
      });
    }

    if (method === "find") {
      it("returns null if no matching potential affiliate", async () => {
        const ssoID = "3a5cdc4a-7b71-497d-9f57-62a8f611376f";
        const profile = await service[method]({ ssoID });
        expect(profile).toBe(null);
      });
    }
  });

  describe("create", () => {
    const mockLocation = {
      id: 3,
      parentID: null,
      name: "Lahore",
      level1Location: {
        id: 1,
        name: "Pakistan",
        parentID: null,
      },
    };

    const createProfileBaseDTO = {
      email: "walt@disney.com",
      givenName: "Walt",
      familyName: "Disney",
      mobilePhoneNumbers: ["+923377178218"],
      landLinePhoneNumbers: ["+922123569856"],
      address: "Walstreet 23",
      govIDType: GovIDType.NIC,
      govIDNumber: "2382738923",
      taxNumber: "2349231292",
      businessName: "Disney",
      affiliateType: AffiliateType.AGENCY,
      locationID: mockLocation.id,
      platform: AffiliatePlatform.MOBILE_APP,
      termsAndConditionsVersion: "1.1.1",
    };

    beforeEach(() => {
      jest.resetAllMocks();

      mockedServices.locations.getWithHierarchy.mockReturnValue(Promise.resolve(mockLocation));
    });

    it("can create a new profile with device data", async () => {
      const ssoID = faker.random.uuid();

      const inputProfile = { ...createProfileBaseDTO, deviceData };
      const outputProfile = await service.create({ ssoID }, inputProfile);
      expect(outputProfile.username).toBe(inputProfile.email);

      const potentialAffiliate = await PotentialAffiliate.findOne({
        where: {
          ssoID: {
            [Op.eq]: ssoID,
          },
        },
      });

      expect(potentialAffiliate.ssoID).toBe(ssoID);
      expect(potentialAffiliate.status).toBe(PotentialAffiliateStatus.UNVERIFIED);
      expect(potentialAffiliate.verificationStatusID).toBe(
        PotentialAffiliateVerificationStatusID.NEW
      );
      expect(potentialAffiliate.affiliateContactID).toBe(null);
      expect(potentialAffiliate.contactData).toMatchSnapshot();
      expect(potentialAffiliate.deviceData).toMatchSnapshot();
      expect(potentialAffiliate.isTest).toBe(0);

      expect(potentialAffiliate.contactData.cityId).toBe(mockLocation.id.toString());
      expect(potentialAffiliate.contactData.countryId).toBe(
        mockLocation.level1Location.id.toString()
      );
    });

    it("can create a new profile without device data", async () => {
      const ssoID = faker.random.uuid();

      const inputProfile = createProfileBaseDTO;
      const outputProfile = await service.create({ ssoID }, inputProfile);
      expect(outputProfile.username).toBe(inputProfile.email);

      const potentialAffiliate = await PotentialAffiliate.findOne({
        where: {
          ssoID: {
            [Op.eq]: ssoID,
          },
        },
      });

      expect(potentialAffiliate.ssoID).toBe(ssoID);
      expect(potentialAffiliate.status).toBe(PotentialAffiliateStatus.UNVERIFIED);
      expect(potentialAffiliate.verificationStatusID).toBe(
        PotentialAffiliateVerificationStatusID.NEW
      );
      expect(potentialAffiliate.affiliateContactID).toBe(null);
      expect(potentialAffiliate.contactData).toMatchSnapshot();
      expect(potentialAffiliate.deviceData).toBe(null);
      expect(potentialAffiliate.isTest).toBe(0);

      expect(potentialAffiliate.contactData.cityId).toBe(mockLocation.id.toString());
      expect(potentialAffiliate.contactData.countryId).toBe(
        mockLocation.level1Location.id.toString()
      );
    });

    each([
      [undefined, undefined, undefined, undefined],
      [undefined, "211.208.0.11", "00:A0:C9:14:C8:29", "Android-10"],
      ["Mobile-Samsung s10", undefined, "00:A0:C9:14:C8:29", "Android-10"],
      ["Mobile-Samsung s10", "211.208.0.11", undefined, "Android-10"],
      ["Mobile-Samsung s10", "211.208.0.11", "00:A0:C9:14:C8:29", undefined],
    ]).it(
      "Should not add device data if any of the mandatory field of Device Data is undefined",
      async (deviceType, ipAddress, macAddress, osVersion) => {
        const ssoID = faker.random.uuid();
        const inputProfile = {
          ...createProfileBaseDTO,
          deviceData: { deviceType, ipAddress, macAddress, osVersion },
        };
        const outputProfile = await service.create({ ssoID }, inputProfile);
        expect(outputProfile.username).toBe(inputProfile.email);

        const potentialAffiliate = await PotentialAffiliate.findOne({
          where: {
            ssoID: {
              [Op.eq]: ssoID,
            },
          },
        });

        expect(potentialAffiliate.deviceData).toBe(null);
      }
    );

    each([
      [AffiliatePlatform.STAFF_APP, AffiliatePlatformID.STAFF_APP],
      [AffiliatePlatform.WEB_APP, AffiliatePlatformID.WEB_APP],
      [AffiliatePlatform.MOBILE_APP, AffiliatePlatformID.MOBILE_APP],
      [null, AffiliatePlatformID.MOBILE_APP],
      [undefined, AffiliatePlatformID.MOBILE_APP],
      ["blabla", null],
    ]).it("converts %s to %s during creation", async (platform, platformID) => {
      const ssoID = faker.random.uuid();

      const inputProfile = {
        ...createProfileBaseDTO,
        platform,
      };

      await service.create({ ssoID }, inputProfile);

      const potentialAffiliate = await PotentialAffiliate.findOne({
        where: {
          ssoID: {
            [Op.eq]: ssoID,
          },
        },
      });

      expect(potentialAffiliate.contactData.platformId).toBe(platformID);
    });

    it("marks profiles with an internal email address as test", async () => {
      const ssoID = faker.random.uuid();

      await service.create(
        { ssoID },
        {
          ...createProfileBaseDTO,
          email: "test+1@sectorlabs.ro",
        }
      );

      const potentialAffiliate = await PotentialAffiliate.findOne({
        where: {
          ssoID: {
            [Op.eq]: ssoID,
          },
        },
      });

      expect(potentialAffiliate.isTest).toBe(1);
    });

    each([
      [
        "links an actual potential affiliate to an actual affiliate based on phone number",
        false,
        false,
        1337,
      ],
      [
        "links a testing potential affiliate to a testing affiliate based on phone number",
        true,
        true,
        1337,
      ],
      [
        "doesn't link a testing potential affiliate to an actual affiliate based on phone number",
        true,
        false,
        null,
      ],
      [
        "doesn't link an actual potential affiliate to a testing affiliate based on phone number",
        false,
        true,
        null,
      ],
    ]).it(
      "%s",
      async (_testName, isTestPotentialAffiliate, isTestAffiliate, expectedAffiliateContactID) => {
        const ssoID = faker.random.uuid();

        const contact = await Contact.create({
          name: "Walt Disney",
          email: "walt@disney.com",
          landLinePhoneNumber: "+922123569856",
        });

        const agent = await Agent.create({
          isTest: isTestAffiliate,
        });

        const affiliate = await Affiliate.create({
          typeID: AffiliateTypeID.AGENCY,
          agencyID: agent.id,
        });

        const affiliateContact = await AffiliateContact.create({
          affiliateID: affiliate.id,
          affiliateContactID: 1337,
          contactID: contact.id,
        });

        await AffiliateContactCell.create({
          contactID: contact.id,
          mobilePhoneNumber: "+923377178218",
        });

        await service.create(
          { ssoID },
          {
            ...createProfileBaseDTO,
            email: isTestPotentialAffiliate ? "test+1@sectorlabs.ro" : "walt@disney.com",
            mobilePhoneNumbers: ["+923377178218"],
            termsAndConditionsVersion: "1.1.1",
          }
        );

        const potentialAffiliate = await PotentialAffiliate.findOne({
          where: {
            ssoID: {
              [Op.eq]: ssoID,
            },
          },
        });

        expect(potentialAffiliate.affiliateContactID).toBe(expectedAffiliateContactID);
      }
    );

    it("throws an error when an invalid location ID is specified", async () => {
      mockedServices.locations.getWithHierarchy.mockReturnValue(Promise.resolve(null));

      const ssoID = faker.random.uuid();

      const inputProfile = {
        ...createProfileBaseDTO,
        locationID: 1234,
      };
      await expect(service.create({ ssoID }, inputProfile)).rejects.toMatchSnapshot();
    });

    it("throws an error when a location ID for which there is no country is specified", async () => {
      mockedServices.locations.getWithHierarchy.mockReturnValue(
        // @ts-ignore
        Promise.resolve({ ...mockLocation, level1Location: null })
      );

      const ssoID = faker.random.uuid();

      const inputProfile = {
        ...createProfileBaseDTO,
        locationID: mockLocation.id,
      };
      await expect(service.create({ ssoID }, inputProfile)).rejects.toMatchSnapshot();
    });

    it("passes null to sourceReferral field if they are not provided", async () => {
      const ssoID = faker.random.uuid();

      const inputProfile = {
        ...createProfileBaseDTO,
        source: AffiliateAppSourceType.FACEBOOK,
      };

      await service.create({ ssoID }, inputProfile);

      const potentialAffiliate = await PotentialAffiliate.findOne({
        where: {
          ssoID: {
            [Op.eq]: ssoID,
          },
        },
      });

      expect(potentialAffiliate.contactData.sourceReferralName).toBeNull();
      expect(potentialAffiliate.contactData.sourceReferralPhoneNumber).toBeNull();
      expect(potentialAffiliate.contactData.source).toBe(AffiliateAppSourceType.FACEBOOK);
    });

    it("passes the source referral fields as expected when they are provided", async () => {
      const ssoID = faker.random.uuid();

      const inputProfile = {
        ...createProfileBaseDTO,
        source: AffiliateAppSourceType.ZAMEEN_EMPLOYEE,
        sourceReferralPhoneNumber: "+923377178218",
        sourceReferralName: "Testing Name",
      };

      await service.create({ ssoID }, inputProfile);

      const potentialAffiliate = await PotentialAffiliate.findOne({
        where: {
          ssoID: {
            [Op.eq]: ssoID,
          },
        },
      });

      expect(potentialAffiliate.contactData.sourceReferralName).toBe("Testing Name");
      expect(potentialAffiliate.contactData.sourceReferralPhoneNumber).toBe("+923377178218");
      expect(potentialAffiliate.contactData.source).toBe(AffiliateAppSourceType.ZAMEEN_EMPLOYEE);
    });
  });
});
