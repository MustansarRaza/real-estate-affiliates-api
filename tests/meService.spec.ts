import { AppError } from "@pf/utils";
import { config } from "affiliates-api/config";
import {
  Affiliate,
  AffiliateAssignee,
  AffiliateAssigneeType,
  AffiliateType,
  GovIDType,
} from "affiliates-api/models";
import { MeService } from "affiliates-api/services";

import { Op } from "sequelize";
import { loadSequelizeFixtures, useKeycloakMock, useMockedServices } from "./support";
import { ModelFixtureConstants, ModelFixtureNames } from "./support/data";

describe("MeService", () => {
  const mockedServices = useMockedServices();
  const service = new MeService(mockedServices);

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

    const createMeBaseDTO = {
      profile: {
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
        termsAndConditionsVersion: "1.1.1",
      },
      credentials: {
        password: "test",
      },
    };

    beforeEach(() => {
      jest.resetAllMocks();

      mockedServices.locations.getWithHierarchy.mockReturnValue(Promise.resolve(mockLocation));
    });

    it("creates a new user", async () => {
      mockedServices.profile.create.mockReturnValueOnce(
        Promise.resolve({ username: "walt@disney.com", ...createMeBaseDTO.profile })
      );

      const createdUser = await service.create(createMeBaseDTO);

      // replacing ID because it changes on every run
      expect(createdUser.ssoID).toBeTruthy();
      expect({ ...createdUser, ssoID: "test" }).toMatchSnapshot();

      // make sure the user was created in keycloak
      const kmock = useKeycloakMock();
      const keycloakUser = kmock.database.findUserByID(createdUser.ssoID);
      expect(keycloakUser?.profile.id).toBe(createdUser.ssoID);
      expect(keycloakUser?.profile.username).toBe(createMeBaseDTO.profile.email);
      expect(keycloakUser?.profile.email).toBe(createMeBaseDTO.profile.email);
      expect(keycloakUser?.profile.enabled).toBe(true);
      expect(keycloakUser?.profile.emailVerified).toBe(true);
      expect(keycloakUser?.profile.firstName).toBe(createMeBaseDTO.profile.givenName);
      expect(keycloakUser?.profile.lastName).toBe(createMeBaseDTO.profile.familyName);
      expect(keycloakUser?.profile.attributes).toMatchSnapshot();
      expect(keycloakUser?.credentials).toHaveLength(1);
      expect(keycloakUser?.credentials[0].value).toBe("test");
    });

    it("throws an error when creating the same user twice", async () => {
      mockedServices.profile.find.mockReturnValue(Promise.resolve(null));

      mockedServices.profile.create.mockReturnValue(
        Promise.resolve({ ...createMeBaseDTO.profile, username: "walt@disney.com" })
      );

      const createdUser = await service.create(createMeBaseDTO);

      mockedServices.profile.find.mockReturnValue(
        Promise.resolve({ ...createMeBaseDTO.profile, username: "walt@disney.com" })
      );

      await expect(service.create(createMeBaseDTO)).rejects.toMatchSnapshot();

      // make sure that the user in keycloak didn't get re-created
      const kmock = useKeycloakMock();
      const keycloakUsers = kmock.database.allUsers();
      expect(keycloakUsers).toHaveLength(1);
      expect(keycloakUsers[0]?.profile.id).toBe(createdUser.ssoID);
    });

    it("allows re-creating the user when a previous attempt failed to create profile", async () => {
      const kmock = useKeycloakMock();

      mockedServices.profile.find.mockReturnValue(Promise.resolve(null));
      mockedServices.profile.create.mockImplementation(() => {
        throw new Error("crap!");
      });

      // user creation will fail because profile creation failed,
      // but we'll end up with a dead user in keycloak
      await expect(service.create(createMeBaseDTO)).rejects.toMatchSnapshot();

      const keycloakUsersAfterFailure = kmock.database.allUsers();
      expect(keycloakUsersAfterFailure).toHaveLength(1);

      // now, we want to do another attempt, it should work
      mockedServices.profile.create.mockReturnValue(
        Promise.resolve({ username: "walt@disney.com", ...createMeBaseDTO.profile })
      );

      const createdUser = await service.create(createMeBaseDTO);
      expect(createdUser).toBeTruthy();

      const keycloakUsersAfterSuccess = kmock.database.allUsers();
      expect(keycloakUsersAfterSuccess).toHaveLength(1);

      // make sure the keycloak user got re-created
      const keycloakUserAfterFailure = keycloakUsersAfterFailure[0];
      const keycloakUserAfterSuccess = keycloakUsersAfterSuccess[0];
      expect(keycloakUserAfterFailure.profile.id).not.toBe(keycloakUserAfterSuccess.profile.id);

      expect(createdUser.ssoID).toBe(keycloakUserAfterSuccess.profile.id);
    });

    it("lets errors during profile creation bubble up", async () => {
      const error = new AppError("brrr stuff goes brrr", {
        statusCode: 400,
      });

      mockedServices.profile.create.mockImplementation(() => {
        throw error;
      });

      await expect(service.create(createMeBaseDTO)).rejects.toThrow(error);
    });

    it("raises an error if keycloak client secret is missing", async () => {
      config.set("keycloak.clientSecret", null);

      await expect(service.create(createMeBaseDTO)).rejects.toMatchSnapshot();
    });

    it("raises an error if an invalid location ID is specified", async () => {
      mockedServices.locations.getWithHierarchy.mockReturnValue(Promise.resolve(null));

      await expect(service.create(createMeBaseDTO)).rejects.toMatchSnapshot();
    });

    it("raises an error if a location without a level1 ID is specified", async () => {
      mockedServices.locations.getWithHierarchy.mockReturnValue(
        Promise.resolve({
          ...mockLocation,
          level1Location: null,
        })
      );

      await expect(service.create(createMeBaseDTO)).rejects.toMatchSnapshot();
    });
  });

  describe("assignees", () => {
    it("returns a list of assignees for the specified SSO ID", async () => {
      await loadSequelizeFixtures(
        ModelFixtureNames.AGENTS,
        ModelFixtureNames.CONTACTS,
        ModelFixtureNames.AFFILIATES,
        ModelFixtureNames.AFFILIATE_CONTACTS,
        ModelFixtureNames.AFFILIATE_ASSIGNEES,
        ModelFixtureNames.POTENTIAL_AFFILIATE_VERIFICATION_STATUS,
        ModelFixtureNames.POTENTIAL_AFFILIATES,
        ModelFixtureNames.USERS
      );

      const assignees = await service.assignees({ ssoID: ModelFixtureConstants.verifiedSSOID });
      expect(assignees).toMatchSnapshot();
    });

    it("returns an empty array if no user exists with the specified sso ID", async () => {
      const ssoID = "bc9ddae1-4db9-41ed-b511-e3f08e5ba3e1";
      const assignees = await service.assignees({ ssoID });
      expect(assignees).toHaveLength(0);
    });
  });

  describe("owner", () => {
    it("returns the assignee that is the BDM for the specified SSO user", async () => {
      await loadSequelizeFixtures(
        ModelFixtureNames.AGENTS,
        ModelFixtureNames.USERS,
        ModelFixtureNames.CONTACTS,
        ModelFixtureNames.AFFILIATES,
        ModelFixtureNames.AFFILIATE_CONTACTS,
        ModelFixtureNames.AFFILIATE_ASSIGNEES
      );

      const owner = await service.owner({ ssoID: ModelFixtureConstants.verifiedSSOID });
      expect(owner?.userID).toBe(ModelFixtureConstants.staffUserBDMID);
    });

    it("returns the agency ID from the affiliate", async () => {
      await loadSequelizeFixtures(
        ModelFixtureNames.AGENTS,
        ModelFixtureNames.USERS,
        ModelFixtureNames.CONTACTS,
        ModelFixtureNames.AFFILIATES,
        ModelFixtureNames.AFFILIATE_CONTACTS,
        ModelFixtureNames.AFFILIATE_ASSIGNEES
      );

      const affiliate = await Affiliate.findOne({
        where: {
          id: {
            [Op.eq]: ModelFixtureConstants.verifiedAffiliateID,
          },
        },
      });

      const owner = await service.owner({ ssoID: ModelFixtureConstants.verifiedSSOID });
      expect(owner?.agencyID).toBe(affiliate.agencyID);
    });

    it("returns the first BDM assignee, ordered by primary key", async () => {
      await loadSequelizeFixtures(
        ModelFixtureNames.AGENTS,
        ModelFixtureNames.USERS,
        ModelFixtureNames.CONTACTS,
        ModelFixtureNames.AFFILIATES,
        ModelFixtureNames.AFFILIATE_CONTACTS
      );

      await AffiliateAssignee.create({
        id: 2,
        affiliateID: ModelFixtureConstants.verifiedAffiliateID,
        type: AffiliateAssigneeType.BDM,
        userID: ModelFixtureConstants.staffUserBDMID,
      });

      await AffiliateAssignee.create({
        id: 1,
        affiliateID: ModelFixtureConstants.verifiedAffiliateID,
        type: AffiliateAssigneeType.BDM,
        userID: ModelFixtureConstants.staffUserCoordinatorID,
      });

      const owner = await service.owner({ ssoID: ModelFixtureConstants.verifiedSSOID });
      expect(owner?.userID).toBe(ModelFixtureConstants.staffUserCoordinatorID);
    });

    it("returns null if no BDM assignee could be found", async () => {
      await loadSequelizeFixtures(
        ModelFixtureNames.AGENTS,
        ModelFixtureNames.USERS,
        ModelFixtureNames.CONTACTS,
        ModelFixtureNames.AFFILIATES,
        ModelFixtureNames.AFFILIATE_CONTACTS
      );

      const owner = await service.owner({ ssoID: ModelFixtureConstants.verifiedSSOID });
      expect(owner).toBe(null);
    });
  });

  describe("acceptTermsAndConditions", () => {
    const profileDTO = {
      profile: {
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
        locationID: 3,
        termsAndConditionsVersion: "1.1.1",
      },
      credentials: {
        password: "test",
      },
    };
    beforeEach(async () => {
      jest.resetAllMocks();

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

      mockedServices.profile.get.mockReturnValue(
        Promise.resolve({ ...profileDTO.profile, username: "walt@disney.com" })
      );
    });
    it("accepts the Terms and conditions for an already created user", async () => {
      const updatedMe = await service.acceptTermsAndConditions(
        ModelFixtureConstants.verifiedSSOID,
        "1.1.1"
      );

      expect(updatedMe.profile.termsAndConditionsVersion).not.toBeNull();
      expect(updatedMe.profile.termsAndConditionsVersion).toEqual("1.1.1");
    });

    it("raises an error if ssoID not found", async () => {
      const error = new AppError("Current user is not an affiliate", {
        statusCode: 404,
      });

      await expect(
        service.acceptTermsAndConditions(ModelFixtureConstants.nonExistantSSOID, "1.1.1")
      ).rejects.toThrow(error);
    });
  });
});
