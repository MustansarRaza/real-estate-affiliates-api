import { AffiliateCommissionType } from "@pf/taxonomies";
import { CommissionsService } from "affiliates-api/services";
import each from "jest-each";
import MockDate from "mockdate";
import { loadSequelizeFixtures } from "./support";
import { createAffiliateCommission, ModelFixtureNames } from "./support/data";

describe("CommissionsService", () => {
  const service = new CommissionsService();

  beforeEach(async () => {
    await loadSequelizeFixtures(
      ModelFixtureNames.COUNTRIES,
      ModelFixtureNames.LOCATIONS,
      ModelFixtureNames.ADDRESSES,
      ModelFixtureNames.CATEGORIES,
      ModelFixtureNames.PROJECTS,
      ModelFixtureNames.AFFILIATE_COMMISSION_PROPERTY_TYPE
    );
    jest.resetAllMocks();
  });

  afterEach(() => {
    MockDate.reset();
  });

  describe("getDetailsFor", () => {
    it("should only get the details for the specified projectIDs and affiliateTypeId", async () => {
      const projectId1 = 1;
      const projectId2 = 2;

      const affiliateCommission1 = await createAffiliateCommission({
        projectId: projectId1,
      });
      await createAffiliateCommission({
        projectId: projectId2,
      });

      const affiliateCommissions = await service.getDetailsFor({
        projectIDs: [projectId1],
        affiliateTypeId: 1,
      });

      expect(Object.keys(affiliateCommissions)).toHaveLength(1);
      expect(affiliateCommissions[projectId1]).toHaveLength(1);
      expect(affiliateCommissions[projectId1][0].projectId).toBe(affiliateCommission1.projectId);
    });

    it("should only get the details for the specified filter options", async () => {
      const projectId1 = 1;
      const projectId2 = 2;

      const affiliateCommission1 = await createAffiliateCommission({
        projectId: projectId1,
      });
      await createAffiliateCommission({
        projectId: projectId2,
        propertyTypeId: 2,
      });

      const affiliateCommissions = await service.getDetailsFor({
        projectIDs: [1, 2],
        affiliateTypeId: 1,
        propertyTypeId: 1,
        createdBy: 483,
        commissionType: AffiliateCommissionType.DISCOUNT_MODEL,
      });

      expect(Object.keys(affiliateCommissions)).toHaveLength(1);
      expect(affiliateCommissions[projectId1]).toHaveLength(1);
      expect(affiliateCommissions[projectId1][0].projectId).toBe(affiliateCommission1.projectId);
      expect(affiliateCommissions[projectId1][0].propertyTypeId).toBe(1);
      expect(affiliateCommissions[projectId1][0].affiliateTypeId).toBe(1);
      expect(affiliateCommissions[projectId1][0].createdBy).toBe(483);
      expect(affiliateCommissions[projectId1][0].commissionType).toBe(
        AffiliateCommissionType.DISCOUNT_MODEL
      );
    });

    each([
      ["2021-04-30T00:00:00.000Z", null, null],
      ["2021-04-30T00:00:00.000Z", "2021-01-27T19:00:00.000Z", null],
      ["2021-04-30T00:00:00.000Z", null, "2022-01-26T19:00:00.000Z"],
      ["2021-04-30T00:00:00.000Z", "2021-01-27T19:00:00.000Z", "2022-01-26T19:00:00.000Z"],
    ]).it(
      "should only get the details for the commmissions against the project that satisfies the condition that current date %s lies within the startDate %s and endDate %s",
      async (currentDate, startDate, endDate) => {
        MockDate.set(currentDate);
        const projectId1 = 1;

        const affiliateCommission1 = await createAffiliateCommission({
          projectId: projectId1,
          startDate: startDate,
          endDate: endDate,
        });

        const affiliateCommissions = await service.getDetailsFor({
          projectIDs: [projectId1],
          affiliateTypeId: 1,
        });

        expect(Object.keys(affiliateCommissions)).toHaveLength(1);
        expect(affiliateCommissions[projectId1]).toHaveLength(1);
        expect(affiliateCommissions[projectId1][0].projectId).toBe(affiliateCommission1.projectId);
      }
    );

    each([
      ["2021-01-01T00:00:00.000Z", "2021-01-27T19:00:00.000Z", null],
      ["2022-02-27T00:00:00.000Z", null, "2022-01-26T19:00:00.000Z"],
      ["2021-01-01T00:00:00.000Z", "2021-01-27T19:00:00.000Z", "2022-01-26T19:00:00.000Z"],
      ["2022-02-27T00:00:00.000Z", "2021-01-27T19:00:00.000Z", "2022-01-26T19:00:00.000Z"],
    ]).it(
      "should not get the details for the commmissions against the project that doesn't satisfies the condition that current date %s lies within the startDate %s and endDate %s",
      async (currentDate, startDate, endDate) => {
        MockDate.set(currentDate);
        const projectId1 = 1;

        await createAffiliateCommission({
          projectId: projectId1,
          startDate: startDate,
          endDate: endDate,
        });

        const affiliateCommissions = await service.getDetailsFor({
          projectIDs: [projectId1],
          affiliateTypeId: 1,
        });

        expect(Object.keys(affiliateCommissions)).toHaveLength(0);
      }
    );
  });

  describe("getCommissionsBreakdownForAffiliate", () => {
    it("return the affiliate commission breakdown against the projectIds and affiliate type", async () => {
      MockDate.set("2021-04-30T00:00:00.000Z");

      const projectId1 = 1;
      const projectId2 = 2;
      const projectId3 = 3;

      await createAffiliateCommission({
        projectId: projectId1,
        affiliateTypeId: 1,
        commissionType: AffiliateCommissionType.FLAT_COMMISSION,
        propertyTypeId: 1,
        commission: 2.5,
        createdAt: "2021-04-30T00:00:00.000Z",
        updtaedAt: "2021-04-30T00:00:00.000Z",
      });
      await createAffiliateCommission({
        projectId: projectId2,
        affiliateTypeId: 1,
        commissionType: AffiliateCommissionType.DISCOUNT_MODEL,
        propertyTypeId: 2,
        downPayment: 30,
        sellingPrice: 91,
        commission: 2,
        createdAt: "2021-04-30T00:00:00.000Z",
        updtaedAt: "2021-04-30T00:00:00.000Z",
      });
      await createAffiliateCommission({
        projectId: projectId2,
        affiliateTypeId: 1,
        commissionType: AffiliateCommissionType.DISCOUNT_MODEL,
        propertyTypeId: 2,
        downPayment: 30,
        sellingPrice: 93,
        commission: 3,
        createdAt: "2021-04-30T00:00:00.000Z",
        updtaedAt: "2021-04-30T00:00:00.000Z",
      });
      await createAffiliateCommission({
        projectId: projectId3,
        affiliateTypeId: 1,
        commissionType: AffiliateCommissionType.UNIT_FROM,
        propertyTypeId: 3,
        unitFrom: 1,
        unitTo: 4,
        commission: 3,
        createdAt: "2021-04-30T00:00:00.000Z",
        updtaedAt: "2021-04-30T00:00:00.000Z",
      });
      await createAffiliateCommission({
        projectId: projectId3,
        affiliateTypeId: 1,
        commissionType: AffiliateCommissionType.UNIT_FROM,
        propertyTypeId: 4,
        unitFrom: 5,
        unitTo: 1000,
        commission: 4,
        createdAt: "2021-04-30T00:00:00.000Z",
        updtaedAt: "2021-04-30T00:00:00.000Z",
      });

      const affiliateCommissionBreakdown = await service.getCommissionsBreakdownForAffiliate({
        projectIDs: [projectId1, projectId2, projectId3],
        affiliateTypeId: 1,
      });

      expect(Object.keys(affiliateCommissionBreakdown)).toHaveLength(3);
      expect(affiliateCommissionBreakdown).toMatchSnapshot();
    });

    it("returns empty commission breakdown mapping if there is no commission records against any of the projectId and affiliate type", async () => {
      const projectId1 = 1;
      const projectId2 = 2;

      const affiliateCommissionBreakdown = await service.getCommissionsBreakdownForAffiliate({
        projectIDs: [projectId1, projectId2],
        affiliateTypeId: 1,
      });

      expect(Object.keys(affiliateCommissionBreakdown)).toHaveLength(0);
    });
  });

  describe("getProjectCommissionStats", () => {
    it("return the commission stats against the projectIds", async () => {
      const projectId1 = 1;
      const projectId2 = 2;

      await createAffiliateCommission({ projectId: projectId1, commission: 2.5 });
      await createAffiliateCommission({ projectId: projectId1, commission: 4 });
      await createAffiliateCommission({ projectId: projectId2, commission: 3.5 });

      const projectCommissionStats = await service.getProjectCommissionStats({
        projectIDs: [projectId1, projectId2],
        affiliateTypeId: 1,
      });

      expect(projectCommissionStats.size).toBe(2);
      expect(projectCommissionStats.get(projectId1)).toStrictEqual({
        max: 4,
        min: 2.5,
      });
      expect(projectCommissionStats.get(projectId2)).toStrictEqual({
        max: 3.5,
        min: 3.5,
      });
    });

    it("includes only those commissions for calculating stats matching with the specified filter options", async () => {
      const projectId1 = 1;

      await createAffiliateCommission({ projectId: projectId1, commission: 2.5 });
      await createAffiliateCommission({ projectId: projectId1, commission: 4, propertyTypeId: 3 });
      await createAffiliateCommission({ projectId: projectId1, commission: 3.5 });

      const projectCommissionStats = await service.getProjectCommissionStats({
        projectIDs: [projectId1],
        affiliateTypeId: 1,
        propertyTypeId: 1,
      });

      expect(projectCommissionStats.size).toBe(1);
      expect(projectCommissionStats.get(projectId1)).toStrictEqual({
        max: 3.5,
        min: 2.5,
      });
    });
  });
});
