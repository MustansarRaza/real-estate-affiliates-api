import { AffiliateAppSourceType } from "@pf/taxonomies";
import { AffiliateType, GovIDType } from "affiliates-api/models";
import each from "jest-each";
import { Response } from "supertest";
import { loadSequelizeFixtures, useKeycloakMock, useRequestFactory } from "./support";
import { ModelFixtureNames } from "./support/data";

describe("GET /me", () => {
  beforeEach(async () => {
    await loadSequelizeFixtures(
      ModelFixtureNames.AGENTS,
      ModelFixtureNames.USERS,
      ModelFixtureNames.CONTACTS,
      ModelFixtureNames.AFFILIATES,
      ModelFixtureNames.AFFILIATE_CONTACTS,
      ModelFixtureNames.POTENTIAL_AFFILIATE_VERIFICATION_STATUS,
      ModelFixtureNames.POTENTIAL_AFFILIATES,
      ModelFixtureNames.AFFILIATE_ASSIGNEES
    );
  });

  it("denies access to unauthenticated requests", async () => {
    const { body, header } = await useRequestFactory()
      .get("/me")
      .expect(403);

    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("returns the summary when the status is verified", async () => {
    const factory = useRequestFactory().withVerifiedUser();
    const user = factory.user();

    const { body, header } = await factory.get("/me").expect(200);

    expect(body.ssoID).toBe(user!.id);
    expect(body.status).toBe("verified");
    expect(body.profile).toBeTruthy();
    expect(body.affiliate.id).toBe(1);
    expect(body.affiliate.assignees).toHaveLength(2);
    expect(body.affiliate.assignees).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("returns the summary when the status is registered", async () => {
    const factory = useRequestFactory().withUnverifiedUser();
    const user = factory.user();

    const { body } = await factory.get("/me").expect(200);

    expect(body.ssoID).toBe(user!.id);
    expect(body.profile).toBeTruthy();
    expect(body.status).toBe("registered");
  });

  it("returns 404 if no profile could be found for the user", async () => {
    // id of a valid keycloak user, but no profile in the db
    const ssoID = "caf59266-3b27-4e66-a47b-d99a42458b6e";

    const { body } = await useRequestFactory()
      .createUser({ id: ssoID })
      .get("/me")
      .expect(404);

    expect(body).toMatchSnapshot();
  });
});

describe("POST /me", () => {
  const dto = {
    profile: {
      email: "walt@disney.com",
      givenName: "Walt",
      familyName: "Disney",
      mobilePhoneNumbers: ["+923377178218"],
      landLinePhoneNumbers: ["+922123569856"],
      address: "Walstreet 23",
      govIDType: GovIDType.NIC,
      govIDNumber: "1234512345671",
      taxNumber: "12345678",
      businessName: "Disney",
      affiliateType: AffiliateType.AGENCY,
      locationID: 3,
      termsAndConditionsVersion: "1.1.1",
    },
    credentials: {
      password: "test",
    },
  };

  const makeRequest = async (params = {}): Promise<Response> =>
    // no authenentication required, do not add here,
    // registration API is public...
    useRequestFactory()
      .post("/me")
      .send({
        ...dto,
        ...params,
      });

  beforeEach(async () => {
    await loadSequelizeFixtures(
      ModelFixtureNames.COUNTRIES,
      ModelFixtureNames.LOCATIONS,
      ModelFixtureNames.POTENTIAL_AFFILIATE_VERIFICATION_STATUS
    );
  });

  it("allows creating a new user and returns 201", async () => {
    const { status, body } = await makeRequest();

    expect(status).toBe(201);

    expect(body.ssoID).toBeTruthy();
    expect({ ...body, ssoID: "test" }).toMatchSnapshot();

    // make sure the user got created in keycloak
    const kmock = useKeycloakMock();
    expect(kmock.database.findUserByID(body.ssoID)).toBeTruthy();
  });

  each([
    "test+99@test.com",
    "test+99@gmail.com",
    "test+99@yahoo.com",
    "test+99@outlook.com",
    "test.1@icloud.com",
    "test.1@test.com",
    "test.1@gmail.com",
    "test.1@yahoo.com",
    "test.1@outlook.com",
    "test.1@icloud.com",
  ]).it("should not normalize the email", async (email) => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, email },
    });

    expect(status).toBe(201);

    expect(body.ssoID).toBeTruthy();
    expect(body.profile.email).toBe(email);

    const kmock = useKeycloakMock();
    const user = kmock.database.findUserByID(body.ssoID);
    expect(user?.profile?.username).toBe(email);
    expect(user?.profile?.email).toBe(email);
  });

  each([
    ["tEsT@test.com", "test@test.com"],
    ["teST@gmail.com", "test@gmail.com"],
    ["TesT@yahoo.com", "test@yahoo.com"],
    ["tEST@outlook.com", "test@outlook.com"],
    ["tESt@icloud.com", "test@icloud.com"],
  ]).it("converts local part of email address to lower-case", async (inputEmail, outputEmail) => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, email: inputEmail },
    });

    expect(status).toBe(201);

    expect(body.ssoID).toBeTruthy();
    expect(body.profile.email).toBe(outputEmail);

    const kmock = useKeycloakMock();
    const user = kmock.database.findUserByID(body.ssoID);
    expect(user?.profile?.username).toBe(outputEmail);
    expect(user?.profile?.email).toBe(outputEmail);
  });

  it("returns 409 if the user with the same email already exists", async () => {
    await makeRequest({
      profile: { ...dto.profile, email: ["test@test.com"] },
    });

    const { status, body, header } = await makeRequest({
      profile: { ...dto.profile, email: ["test@test.com"] },
    });

    expect(status).toBe(409);
    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  it("returns 409 if the user with the same mobile phone number already exists", async () => {
    await makeRequest({
      profile: {
        ...dto.profile,
        email: "test1@test.com",
        mobilePhoneNumbers: ["+922123569856"],
      },
    });

    const { status, body, header } = await makeRequest({
      profile: {
        ...dto.profile,
        email: "test2@test.com",
        mobilePhoneNumbers: ["+922123569856"],
      },
    });

    expect(status).toBe(409);
    expect(body).toMatchSnapshot();
    expect(header).toMatchSnapshot();
  });

  ["email", "givenName", "familyName", "address", "businessName"].forEach((fieldName) =>
    it(`trims input values for ${fieldName} field`, async () => {
      const { status, body } = await makeRequest({
        profile: { ...dto.profile, [fieldName]: " test@test.com " },
      });

      expect(status).toBe(201);
      expect(body.profile[fieldName]).toBe("test@test.com");
    })
  );

  ["givenName", "familyName", "address", "businessName"].forEach((fieldName) =>
    it(`removes consecutive spaces for ${fieldName} field`, async () => {
      const { status, body } = await makeRequest({
        profile: { ...dto.profile, [fieldName]: " this text has    spaces " },
      });

      expect(status).toBe(201);
      expect(body.profile[fieldName]).toBe("this text has spaces");
    })
  );

  it(`removes all spaces from the email`, async () => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, email: "  test @  tes t.com " },
    });

    expect(status).toBe(201);
    expect(body.profile.email).toBe("test@test.com");
  });

  [null, undefined, "", "   ", "bla", 12, "te @ goo"].forEach((inputValue) =>
    it(`does not allow ${inputValue} for email field`, async () => {
      const { status, body } = await makeRequest({
        profile: { ...dto.profile, email: inputValue },
      });

      expect(status).toBe(400);
      expect(body).toMatchSnapshot();
    })
  );

  [null, undefined, "", "   "].forEach((inputValue) =>
    it(`does not allow ${inputValue} for givenName field`, async () => {
      const { status, body } = await makeRequest({
        profile: { ...dto.profile, givenName: inputValue },
      });

      expect(status).toBe(400);
      expect(body).toMatchSnapshot();
    })
  );

  [null, undefined, "", "   "].forEach((inputValue) =>
    it(`does not allow ${inputValue} for familyName field`, async () => {
      const { status, body } = await makeRequest({
        profile: { ...dto.profile, familyName: inputValue },
      });

      expect(status).toBe(400);
      expect(body).toMatchSnapshot();
    })
  );

  it("requires at least one mobile phone number", async () => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, mobilePhoneNumbers: [] },
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("does not allow non-e.164 formatted mobile phone numbers", async () => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, mobilePhoneNumbers: ["03377178218"] },
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("allows non e.164 formatted mobile phone numbers that can be formatted automatically", async () => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, mobilePhoneNumbers: ["+9203377178218"] },
    });

    expect(status).toBe(201);
    expect(body.profile.mobilePhoneNumbers).toStrictEqual(["+923377178218"]);
  });

  it("removes all spaces from mobile phone numbers", async () => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, mobilePhoneNumbers: ["+9233 771 782  18"] },
    });

    expect(status).toBe(201);
    expect(body.profile.mobilePhoneNumbers).toStrictEqual(["+923377178218"]);
  });

  it("does not allow more than one mobile phone number", async () => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, mobilePhoneNumbers: ["+923377178218", "+922123569856"] },
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("allows an empty list of landline phone numbers", async () => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, landLinePhoneNumbers: [] },
    });

    expect(status).toBe(201);
    expect(body.profile.landLinePhoneNumbers).toStrictEqual([]);
  });

  it("does not allow non-e.164 formatted landline phone numbers", async () => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, landLinePhoneNumbers: ["03377178218"] },
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  it("allows non e.164 formatted landline phone numbers that can be formatted automatically", async () => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, landLinePhoneNumbers: ["+9203377178218"] },
    });

    expect(status).toBe(201);
    expect(body.profile.landLinePhoneNumbers).toStrictEqual(["+923377178218"]);
  });

  it("removes all spaces from landline phone numbers", async () => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, landLinePhoneNumbers: ["+9233 771 782  18"] },
    });

    expect(status).toBe(201);
    expect(body.profile.landLinePhoneNumbers).toStrictEqual(["+923377178218"]);
  });

  it("does not allow more than one landline phone number", async () => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, landLinePhoneNumbers: ["+923377178218", "+922123569856"] },
    });

    expect(status).toBe(400);
    expect(body).toMatchSnapshot();
  });

  [null, undefined, "", "   "].forEach((inputValue) =>
    it(`does not allow ${inputValue} for address field`, async () => {
      const { status, body } = await makeRequest({
        profile: { ...dto.profile, address: inputValue },
      });

      expect(status).toBe(400);
      expect(body).toMatchSnapshot();
    })
  );

  [Object.values(GovIDType)].forEach((value) =>
    it(`allows ${value} for govIDType field`, async () => {
      const { status } = await makeRequest({
        profile: { ...dto.profile, govIDType: value },
      });

      expect(status).toBe(201);
    })
  );

  [null, undefined, "", "   ", "bla", 12].forEach((inputValue) =>
    it(`does not allow ${inputValue} for govIDType field`, async () => {
      const { status, body } = await makeRequest({
        profile: { ...dto.profile, govIDType: inputValue },
      });

      expect(status).toBe(400);
      expect(body).toMatchSnapshot();
    })
  );

  [null, undefined, "", "   ", "12345a2345671", "12345", "123456789999", "12345678913254"].forEach(
    (inputValue) =>
      it(`does not allow ${inputValue} for govIDNumber field`, async () => {
        const { status, body } = await makeRequest({
          profile: { ...dto.profile, govIDNumber: inputValue },
        });

        expect(status).toBe(400);
        expect(body).toMatchSnapshot();
      })
  );

  it("allows a govIDNumber with dashes and removes the dashes", async () => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, govIDNumber: "12345-1234567-1" },
    });

    expect(status).toBe(201);
    expect(body.profile.govIDNumber).toBe("1234512345671");
  });

  it("allows a govIDNumber with spaces and removes the spaces", async () => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, govIDNumber: "  123 45-12345 67  -1 " },
    });

    expect(status).toBe(201);
    expect(body.profile.govIDNumber).toBe("1234512345671");
  });

  it("allows a govIDNumber without dashes", async () => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, govIDNumber: "1234512345671" },
    });

    expect(status).toBe(201);
    expect(body.profile.govIDNumber).toBe("1234512345671");
  });

  ["", "   ", "123456", "1234567", "123456789", "1234567a"].forEach((inputValue) =>
    it(`does not allow ${inputValue} for taxNumber field`, async () => {
      const { status, body } = await makeRequest({
        profile: { ...dto.profile, taxNumber: inputValue },
      });

      expect(status).toBe(400);
      expect(body).toMatchSnapshot();
    })
  );

  it("allows a tax number with dashes and removes the dashes", async () => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, taxNumber: "1234567-8" },
    });

    expect(status).toBe(201);
    expect(body.profile.taxNumber).toBe("12345678");
  });

  it("allows a tax number with spaces and removes the spaces", async () => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, taxNumber: " 1234567-  8  " },
    });

    expect(status).toBe(201);
    expect(body.profile.taxNumber).toBe("12345678");
  });

  it("allows a tax number without dashes", async () => {
    const { status, body } = await makeRequest({
      profile: { ...dto.profile, taxNumber: "12345678" },
    });

    expect(status).toBe(201);
    expect(body.profile.taxNumber).toBe("12345678");
  });

  ["", "   "].forEach((inputValue) =>
    it(`does not allow ${inputValue} for businessName field`, async () => {
      const { status, body } = await makeRequest({
        profile: { ...dto.profile, businessName: inputValue },
      });

      expect(status).toBe(400);
      expect(body).toMatchSnapshot();
    })
  );

  ["agency", "individual", "broker", "agent"].forEach((value) =>
    it(`allows ${value} for affiliateType field`, async () => {
      const { status } = await makeRequest({
        profile: { ...dto.profile, affiliateType: value },
      });

      expect(status).toBe(201);
    })
  );

  [null, undefined, "", "   ", "bla", 12].forEach((inputValue) =>
    it(`does not allow ${inputValue} for affiliateType field`, async () => {
      const { status, body } = await makeRequest({
        profile: { ...dto.profile, affiliateType: inputValue },
      });

      expect(status).toBe(400);
      expect(body).toMatchSnapshot();
    })
  );

  [null, undefined, "", "   ", "bla", 1.2].forEach((inputValue) =>
    it(`does not allow ${inputValue} for locationID field`, async () => {
      const { status, body } = await makeRequest({
        profile: { ...dto.profile, locationID: inputValue },
      });

      expect(status).toBe(400);
      expect(body).toMatchSnapshot();
    })
  );

  ["staff_app", "propforce.com", "propforce_mobile_app", null, undefined].forEach((value) =>
    it(`allows ${value} for platform field`, async () => {
      const { status } = await makeRequest({
        profile: { ...dto.profile, platform: value },
      });

      expect(status).toBe(201);
    })
  );

  ["", "blabla"].forEach((inputValue) =>
    it(`does not allow ${inputValue} for platform field`, async () => {
      const { status, body } = await makeRequest({
        profile: { ...dto.profile, platform: inputValue },
      });

      expect(status).toBe(400);
      expect(body).toMatchSnapshot();
    })
  );

  [null, undefined, ""].forEach((inputValue) =>
    it(`does not allow ${inputValue} for password field`, async () => {
      const { status, body } = await makeRequest({
        credentials: { password: inputValue },
      });

      expect(status).toBe(400);
      expect(body).toMatchSnapshot();
    })
  );

  [null, undefined, ...Object.values(AffiliateAppSourceType)].forEach((source) =>
    it(`validates ${source} as valid for source`, async () => {
      const { status } = await makeRequest({
        profile: { ...dto.profile, source },
      });

      expect(status).toBe(201);
    })
  );

  ["", "invalidSource"].forEach((source) =>
    it(`validates ${source} as invalid`, async () => {
      const { status, body } = await makeRequest({
        profile: { ...dto.profile, source },
      });
      expect(status).toBe(400);
      expect(body).toMatchSnapshot();
    })
  );

  [null, undefined, "+9203377178218", "+9233 771 782  18"].forEach((value) =>
    it(`validates ${value} as valid sourceReferralPhoneNumber`, async () => {
      const { status } = await makeRequest({
        profile: { ...dto.profile, sourceReferralPhoneNumber: value },
      });

      expect(status).toBe(201);
    })
  );

  ["", "03377178218", "def not a number"].forEach((value) =>
    it(`validates ${value} as invalid sourceReferralPhoneNumber`, async () => {
      const { status, body } = await makeRequest({
        profile: { ...dto.profile, sourceReferralPhoneNumber: value },
      });

      expect(status).toBe(400);
      expect(body).toMatchSnapshot();
    })
  );

  [null, undefined, "Testing", "   This will be trimmed   "].forEach((value) =>
    it(`validates ${value} as valid sourceReferralName`, async () => {
      const { status } = await makeRequest({
        profile: { ...dto.profile, sourceReferralName: value },
      });

      expect(status).toBe(201);
    })
  );

  const deviceData = {
    deviceType: "Mobile-Samsung s10",
    ipAddress: "211.208.0.11",
    macAddress: "00:A0:C9:14:C8:29",
    osVersion: "Android-10",
  };

  [null, undefined, deviceData].forEach((value) => {
    it(`allows creating a new user with device data ${value} and returns 201`, async () => {
      const { status, body } = await makeRequest({
        profile: { ...dto.profile, deviceData: value },
      });

      expect(status).toBe(201);

      expect(body.ssoID).toBeTruthy();
      expect({ ...body, ssoID: "test" }).toMatchSnapshot();

      // make sure the user got created in keycloak
      const kmock = useKeycloakMock();
      expect(kmock.database.findUserByID(body.ssoID)).toBeTruthy();
    });
  });

  each([
    [undefined, undefined, undefined, undefined],
    [undefined, "211.208.0.11", "00:A0:C9:14:C8:29", "Android-10"],
    ["Mobile-Samsung s10", undefined, "00:A0:C9:14:C8:29", "Android-10"],
    ["Mobile-Samsung s10", "211.208.0.11", undefined, "Android-10"],
    ["Mobile-Samsung s10", "211.208.0.11", "00:A0:C9:14:C8:29", undefined],
  ]).it(
    "Should throw error if any of the field of Device Data is undefined",
    async (deviceType, ipAddress, macAddress, osVersion) => {
      const { status } = await makeRequest({
        profile: { ...dto.profile, deviceData: { deviceType, ipAddress, macAddress, osVersion } },
      });

      expect(status).toBe(400);
    }
  );

  [null, undefined, "5456utgc67", "00:A0:C9:14:C8:29:67"].forEach((value) =>
    it(`validates ${value} as invalid MAC Address`, async () => {
      const { status } = await makeRequest({
        profile: { ...dto.profile, deviceData: { ...deviceData, macAddress: value } },
      });

      expect(status).toBe(400);
    })
  );

  ["FF:A0:D9:14:C8:56", " 00  :A0 : C9:    14:C8:29  "].forEach((value) =>
    it(`validates ${value} a valid MAC Address after removing all the spaces`, async () => {
      const { status } = await makeRequest({
        profile: { ...dto.profile, deviceData: { ...deviceData, macAddress: value } },
      });

      expect(status).toBe(201);
    })
  );

  [null, undefined, "5456utgc67", "209.123.567.612", "0.0.0.0.0"].forEach((value) =>
    it(`validates ${value} as invalid IP Address`, async () => {
      const { status } = await makeRequest({
        profile: { ...dto.profile, deviceData: { ...deviceData, ipAddress: value } },
      });

      expect(status).toBe(400);
    })
  );

  ["127.0.0.2", " 2 1 3  .100 . 200.3    "].forEach((value) =>
    it(`validates ${value} a valid IP Address after removing all the spaces`, async () => {
      const { status } = await makeRequest({
        profile: { ...dto.profile, deviceData: { ...deviceData, ipAddress: value } },
      });

      expect(status).toBe(201);
    })
  );

  [null, undefined, "", "     "].forEach((value) =>
    it(`validates ${value} as invalid OS version`, async () => {
      const { status } = await makeRequest({
        profile: { ...dto.profile, deviceData: { ...deviceData, osVersion: value } },
      });

      expect(status).toBe(400);
    })
  );

  ["Android-11", "IOS  -  12", "     Android-9    "].forEach((value) =>
    it(`validates ${value} as valid OS version after triming and removing the consecutive spaces`, async () => {
      const { status } = await makeRequest({
        profile: { ...dto.profile, deviceData: { ...deviceData, osVersion: value } },
      });

      expect(status).toBe(201);
    })
  );

  [null, undefined, "", "     "].forEach((value) =>
    it(`validates ${value} as invalid Device Type`, async () => {
      const { status } = await makeRequest({
        profile: { ...dto.profile, deviceData: { ...deviceData, deviceType: value } },
      });

      expect(status).toBe(400);
    })
  );

  it(`validates "    Mobile  -Samsung s10    " as valid Device Type after triming and removing the consecutive spaces`, async () => {
    const { status, body } = await makeRequest({
      profile: {
        ...dto.profile,
        deviceData: { ...deviceData, deviceType: "    Mobile-Samsung  s10    " },
      },
    });

    expect(status).toBe(201);
    expect(body.profile.deviceType).toStrictEqual("Mobile-Samsung s10");
  });
});
