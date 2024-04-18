import { SourcePlatform } from "@pf/taxonomies";
import {
  Address,
  Lead,
  LeadClassification,
  LeadClassificationID,
  LeadInquiryBudgetCurrency,
  LeadInquiryObjectType,
  LeadLocation,
  LeadLocationType,
  LeadMarket,
  LeadSide,
  LeadSourceMapping,
  LeadState,
  LeadStatus,
  Purpose,
  PurposeID,
} from "affiliates-api/models";
import { LeadsService } from "affiliates-api/services";
import { LeadDTO } from "affiliates-api/services/leads";
import MockDate from "mockdate";
import { Op } from "sequelize";
import { loadSequelizeFixtures, useMockedServices } from "./support";
import { createLead, ModelFixtureConstants, ModelFixtureNames } from "./support/data";

describe("LeadsService", () => {
  const mockedServices = useMockedServices();
  const service = new LeadsService(mockedServices);

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
      ModelFixtureNames.AGENCY_CONFIGURATION,
      ModelFixtureNames.USERS,
      ModelFixtureNames.CONTACTS,
      ModelFixtureNames.CATEGORIES,
      ModelFixtureNames.DESIGNATIONS,
      ModelFixtureNames.COUNTRIES,
      ModelFixtureNames.LOCATIONS,
      ModelFixtureNames.AFFILIATES,
      ModelFixtureNames.AFFILIATE_CONTACTS,
      ModelFixtureNames.AFFILIATE_ASSIGNEES,
      ModelFixtureNames.POTENTIAL_AFFILIATE_VERIFICATION_STATUS,
      ModelFixtureNames.POTENTIAL_AFFILIATES,
      ModelFixtureNames.CLIENTS,
      ModelFixtureNames.LEAD_SOURCE,
      ModelFixtureNames.LEAD_STATUSES
    );
  });

  describe("list", () => {
    it("only returns active leads", async () => {
      const activeLead = await createLead(
        ModelFixtureConstants.staffUserBDMID,
        ModelFixtureConstants.activeAffiliateClientID,
        {
          state: LeadState.ON,
        }
      );
      await createLead(
        ModelFixtureConstants.staffUserBDMID,
        ModelFixtureConstants.activeAffiliateClientID,
        { state: LeadState.DELETED }
      );
      await createLead(
        ModelFixtureConstants.staffUserBDMID,
        ModelFixtureConstants.activeAffiliateClientID,
        { state: LeadState.PENDING }
      );

      const leads = await service.list({ ssoID: ModelFixtureConstants.verifiedSSOID });

      expect(leads).toHaveLength(1);
      expect(leads[0].id).toBe(activeLead.id);
    });

    it("should not return locationIds if leadLocationsRequired is set to false", async () => {
      await loadSequelizeFixtures(ModelFixtureNames.LEADS, ModelFixtureNames.LEAD_LOCATIONS);

      const leads = await service.list({ ssoID: ModelFixtureConstants.verifiedSSOID }, false);

      leads.forEach((lead: LeadDTO) => {
        expect(lead.inquiry.locationIDs.length).toEqual(0);
      });
    });

    [
      {},
      { fromDate: "2020-01-01T00:00:00Z" },
      { toDate: "2021-04-15T00:00:00Z" },
      { fromDate: "2020-01-01T00:00:00Z", toDate: "2020-12-31T00:00:00Z" },
      { fromDate: "2021-01-01T00:00:00Z", toDate: "2021-04-15T00:00:00Z" },
    ].forEach((dateRange) => {
      it(`should consider only the tasks that were created againt the lead in the provided interval i.e. fromDate : ${dateRange.fromDate}, toDate: ${dateRange.toDate}`, async () => {
        await loadSequelizeFixtures(
          ModelFixtureNames.LEADS,
          ModelFixtureNames.LEAD_LOCATIONS,
          ModelFixtureNames.TASK_TYPES,
          ModelFixtureNames.TASKS
        );

        //@ts-ignore
        mockedServices.taskTypes.getMappings.mockResolvedValue({
          "3": { id: 3, title: "Meeting (Arrange)", parentID: 62 },
          "6": { id: 6, title: "Token Received", parentID: 56 },
          "100": { id: 100, title: "Generate Token", parentID: 56 },
          "85": { id: 85, title: "Partial Down Payment", parentID: 56 },
          "52": { id: 85, title: "Closed (Won)", parentID: 56 },
        });

        const leads = await service.list(
          { ssoID: ModelFixtureConstants.verifiedSSOID },
          false,
          dateRange
        );

        leads.forEach((lead: LeadDTO) => {
          if (lead.lastTask) {
            if (dateRange.fromDate)
              expect(lead.lastTask.dateAdded >= dateRange.fromDate).toBeTruthy();
            if (dateRange.toDate) expect(lead.lastTask.dateAdded <= dateRange.toDate).toBeTruthy();
          }
        });
      });
    });

    it("sets purpose to for-sale when market is primary and there is no purpose", async () => {
      const primaryMarketLead = await createLead(
        ModelFixtureConstants.staffUserBDMID,
        ModelFixtureConstants.activeAffiliateClientID,
        {
          market: LeadMarket.PRIMARY,
          inquiryPurposeID: null,
        }
      );
      const leads = await service.list({ ssoID: ModelFixtureConstants.verifiedSSOID });

      expect(leads).toHaveLength(1);
      expect(leads[0].id).toBe(primaryMarketLead.id);
      expect(leads[0].inquiry.purpose).toBe(Purpose.FOR_SALE);
    });

    it("overwrites the purpose to for-sale when the market is primary", async () => {
      const primaryMarketLead = await createLead(
        ModelFixtureConstants.staffUserBDMID,
        ModelFixtureConstants.activeAffiliateClientID,
        {
          market: LeadMarket.PRIMARY,
          inquiryPurposeID: PurposeID.FOR_SALE as number,
        }
      );
      const leads = await service.list({ ssoID: ModelFixtureConstants.verifiedSSOID });

      expect(leads).toHaveLength(1);
      expect(leads[0].id).toBe(primaryMarketLead.id);
      expect(leads[0].inquiry.purpose).toBe(Purpose.FOR_SALE);
    });

    it("does not overwrite the purpose when the market is secondary", async () => {
      const secondaryMarketLead = await createLead(
        ModelFixtureConstants.staffUserBDMID,
        ModelFixtureConstants.activeAffiliateClientID,
        {
          market: LeadMarket.SECONDARY,
          inquiryPurposeID: PurposeID.FOR_RENT as number,
        }
      );
      const leads = await service.list({ ssoID: ModelFixtureConstants.verifiedSSOID });

      expect(leads).toHaveLength(1);
      expect(leads[0].id).toBe(secondaryMarketLead.id);
      expect(leads[0].inquiry.purpose).toBe(Purpose.FOR_RENT);
    });
  });

  describe("listSummary", () => {
    it("should return default summary if no fromDate is provided as well as there doesn't exist any lead against the affiliate", async () => {
      const defaultSummary = {
        active: 0,
        inactive: 0,
        tokenGenerated: 0,
        closedWon: 0,
        downPayment: 0,
        completeDownPayment: 0,
      };

      const leadsSummary = await service.listSummary(
        { ssoID: ModelFixtureConstants.verifiedSSOID },
        {}
      );

      expect(leadsSummary).toEqual(defaultSummary);
    });

    it("should return default summary if there doesn't exist any lead against the affiliate", async () => {
      const defaultSummary = {
        active: 0,
        inactive: 0,
        tokenGenerated: 0,
        closedWon: 0,
        downPayment: 0,
        completeDownPayment: 0,
      };

      const leadsSummary = await service.listSummary(
        { ssoID: ModelFixtureConstants.verifiedSSOID },
        { fromDate: "2020-01-01T00:00:00Z", toDate: "2020-12-31T00:00:00Z" }
      );

      expect(leadsSummary).toEqual(defaultSummary);
    });

    it("should return the summary having the inactive count immediately if there doesn't exist any task against the lead(i.e. no active lead)", async () => {
      await loadSequelizeFixtures(ModelFixtureNames.LEADS, ModelFixtureNames.LEAD_LOCATIONS);

      const defaultSummary = {
        active: 0,
        inactive: 4,
        tokenGenerated: 0,
        closedWon: 0,
        downPayment: 0,
        completeDownPayment: 0,
      };

      const leadsSummary = await service.listSummary(
        { ssoID: ModelFixtureConstants.verifiedSSOID },
        { fromDate: "2020-01-01T00:00:00Z", toDate: "2020-04-15T00:00:00Z" }
      );

      expect(leadsSummary).toEqual(defaultSummary);
    });

    it("should return the summary having the inactive count immediately if there doesn't exist any task against the lead(i.e. no active lead) and is created before the provided toDate in the date range", async () => {
      await loadSequelizeFixtures(ModelFixtureNames.LEADS, ModelFixtureNames.LEAD_LOCATIONS);

      const defaultSummary = {
        active: 0,
        inactive: 3,
        tokenGenerated: 0,
        closedWon: 0,
        downPayment: 0,
        completeDownPayment: 0,
      };

      const leadsSummary = await service.listSummary(
        { ssoID: ModelFixtureConstants.verifiedSSOID },
        { fromDate: "2020-03-01T00:00:00Z", toDate: "2020-03-12T00:00:00Z" }
      );

      expect(leadsSummary).toEqual(defaultSummary);
    });

    it("should return the default summary immediately if there doesn't exist any lead that is created before the provided toDate in the date range", async () => {
      await loadSequelizeFixtures(ModelFixtureNames.LEADS, ModelFixtureNames.LEAD_LOCATIONS);

      const defaultSummary = {
        active: 0,
        inactive: 0,
        tokenGenerated: 0,
        closedWon: 0,
        downPayment: 0,
        completeDownPayment: 0,
      };

      const leadsSummary = await service.listSummary(
        { ssoID: ModelFixtureConstants.verifiedSSOID },
        { fromDate: "2020-01-01T00:00:00Z", toDate: "2020-03-01T00:00:00Z" }
      );

      expect(leadsSummary).toEqual(defaultSummary);
    });

    [
      {},
      { fromDate: "2020-01-01T00:00:00Z" },
      { toDate: "2021-04-15T00:00:00Z" },
      { fromDate: "2020-01-01T00:00:00Z", toDate: "2020-12-31T00:00:00Z" },
      { fromDate: "2021-01-01T00:00:00Z", toDate: "2021-02-15T00:00:00Z" },
      { fromDate: "2021-02-15T00:00:00Z", toDate: "2021-03-31T00:00:00Z" },
      { fromDate: "2021-01-01T00:00:00Z", toDate: "2021-04-15T00:00:00Z" },
    ].forEach((dateRange) => {
      it(`should return the summary by considering only the tasks as well as winning tasks that were created against the lead in the provided interval i.e. fromDate : ${dateRange.fromDate}, toDate: ${dateRange.toDate}`, async () => {
        await loadSequelizeFixtures(
          ModelFixtureNames.LEADS,
          ModelFixtureNames.LEAD_LOCATIONS,
          ModelFixtureNames.TASK_TYPES,
          ModelFixtureNames.TASKS
        );

        //@ts-ignore
        mockedServices.taskTypes.getMappings.mockResolvedValue({
          "3": { id: 3, title: "Meeting (Arrange)", parentID: 53 },
          "6": { id: 6, title: "Token Received", parentID: 56 },
          "100": { id: 100, title: "Generate Token", parentID: 56 },
          "85": { id: 85, title: "Partial Down Payment", parentID: 56 },
          "52": { id: 85, title: "Closed (Won)", parentID: 56 },
        });

        const leadsSummary = await service.listSummary(
          { ssoID: ModelFixtureConstants.verifiedSSOID },
          dateRange
        );

        expect(leadsSummary).toMatchSnapshot();
      });
    });
  });

  describe("create", () => {
    const createLeadBaseDTO = {
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
        unitNumber: null,
      },
      source: SourcePlatform.AFFILIATES_WEB_APP,
    };

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const queryLead = (leadID: number): Promise<Lead | null> =>
      Lead.findOne({
        where: {
          id: {
            [Op.eq]: leadID,
          },
        },
        include: [
          {
            model: LeadLocation,
          },
        ],
      });

    const queryLeadWithAddress = (leadID: number): Promise<Lead | null> =>
      Lead.findOne({
        where: {
          id: {
            [Op.eq]: leadID,
          },
        },
        include: [
          {
            model: LeadLocation,
          },
          {
            model: Address,
          },
        ],
      });

    const queryLeadSourceMapping = (leadId: number): Promise<LeadSourceMapping | null> =>
      LeadSourceMapping.findOne({
        where: {
          inquiryId: { [Op.eq]: leadId },
        },
      });
    const leadServiceMock: any = {
      mockShareWithSupport: jest.fn(),
    };

    beforeAll(() => {
      MockDate.set("2020-03-28T14:12:00.270Z");
    });

    afterAll(() => {
      MockDate.reset();
    });

    it("can create a lead", async () => {
      const leadDTO = await service.create(
        { ssoID: ModelFixtureConstants.verifiedSSOID },
        createLeadBaseDTO,
        leadServiceMock,
        {}
      );

      const leadSourceMappings = await queryLeadSourceMapping(leadDTO.id);

      const lead = await queryLead(leadDTO.id);
      expect({ ...lead?.toJSON(), id: null }).toMatchSnapshot();

      expect(lead).toBeTruthy();
      expect(lead?.id).toBe(leadDTO.id);
      expect(lead?.source).toBe(SourcePlatform.AFFILIATES_WEB_APP);
      expect(lead?.userID).toBe(ModelFixtureConstants.staffUserBDMID);
      expect(lead?.clientID).toBe(1);
      expect(lead?.statusID).toBe(ModelFixtureConstants.leadStatusNewID);
      expect(lead?.side).toBe(LeadSide.DEMAND);
      expect(lead?.market).toBe(LeadMarket.PRIMARY);
      expect(lead?.classificationID).toBe(LeadClassificationID.MODERATE);
      expect(lead?.inquiryObjectType).toBe("project");
      expect(lead?.inquiryObjectID).toBe(1);
      expect(lead?.inquiryPurposeID).toBe(PurposeID.FOR_SALE);
      expect(lead?.inquiryCategoryID).toBe(1);
      expect(lead?.inquiryBudgetAmount).toBe(5000);
      expect(lead?.inquiryBudgetCurrency).toBe("EUR");
      expect(lead?.inquiryBedroomCount).toBe(3);
      expect(lead?.inquiryBathroomCount).toBe(2);
      expect(lead?.LeadLocations).toHaveLength(1);
      expect(lead?.LeadLocations[0].leadID).toBe(lead?.id);
      expect(lead?.LeadLocations[0].locationID).toBe(3);
      expect(lead?.LeadLocations[0].type).toBe(LeadLocationType.INTERESTED_IN);
      expect(lead?.LeadLocations[0].createdAt).toBeTruthy();
      expect(lead?.createdAt).toBeTruthy();
      expect(lead?.updatedAt).toBeTruthy();

      expect(leadSourceMappings).toBeTruthy();
      expect(leadSourceMappings?.inquirySourceId).toBe(ModelFixtureConstants.affiliateLeadSourceId);
    });

    it("can create a lead not linked to an object", async () => {
      const leadDTO = await service.create(
        { ssoID: ModelFixtureConstants.verifiedSSOID },
        { ...createLeadBaseDTO, inquiry: { ...createLeadBaseDTO.inquiry, object: null } },
        leadServiceMock,
        {}
      );

      expect(leadDTO.inquiry.object).toBe(null);

      const lead = await queryLead(leadDTO.id);
      expect(lead?.inquiryObjectType).toBe(null);
      expect(lead?.inquiryObjectID).toBe(null);
    });

    it("can create a lead without any locations", async () => {
      const leadDTO = await service.create(
        { ssoID: ModelFixtureConstants.verifiedSSOID },
        {
          ...createLeadBaseDTO,
          inquiry: { ...createLeadBaseDTO.inquiry, locationIDs: [] },
        },
        leadServiceMock,
        {}
      );

      expect(leadDTO.inquiry.locationIDs).toEqual([]);

      const lead = await queryLead(leadDTO.id);
      expect(lead?.LeadLocations).toHaveLength(0);
    });

    it("does not allow creating a lead without having an owner", async () => {
      mockedServices.me.owner.mockReturnValue(Promise.resolve(null));

      await expect(
        service.create(
          { ssoID: ModelFixtureConstants.unverifiedSSOID },
          createLeadBaseDTO,
          leadServiceMock,
          {}
        )
      ).rejects.toMatchSnapshot();
    });

    it("does not allow creating a lead with an invalid category ID", async () => {
      await expect(
        service.create(
          { ssoID: ModelFixtureConstants.unverifiedSSOID },
          {
            ...createLeadBaseDTO,
            inquiry: { ...createLeadBaseDTO.inquiry, categoryID: 999 },
          },
          leadServiceMock,
          {}
        )
      ).rejects.toMatchSnapshot();
    });

    it("does not allow creating a lead with an invalid location ID", async () => {
      await expect(
        service.create(
          { ssoID: ModelFixtureConstants.unverifiedSSOID },
          {
            ...createLeadBaseDTO,
            inquiry: { ...createLeadBaseDTO.inquiry, locationIDs: [999] },
          },
          leadServiceMock,
          {}
        )
      ).rejects.toMatchSnapshot();
    });

    it("returns a nice error if the initial status is not available", async () => {
      LeadStatus.destroy({ truncate: true });

      await expect(
        service.create(
          { ssoID: ModelFixtureConstants.unverifiedSSOID },
          createLeadBaseDTO,
          leadServiceMock,
          {}
        )
      ).rejects.toMatchSnapshot();
    });

    it("properly creates a secondary market supply lead with unit number", async () => {
      const testUnitNumber = "4C-1234";
      const testLocationID = 3;
      const leadDTO = await service.create(
        { ssoID: ModelFixtureConstants.verifiedSSOID },
        {
          ...createLeadBaseDTO,
          market: LeadMarket.SECONDARY,
          side: LeadSide.SUPPLY,
          inquiry: {
            ...createLeadBaseDTO.inquiry,
            unitNumber: testUnitNumber,
            locationIDs: [testLocationID],
          },
        },
        leadServiceMock,
        {}
      );

      const lead = await queryLeadWithAddress(leadDTO.id);

      expect(lead).toBeDefined();
      expect(lead?.Address).toBeDefined();

      expect(lead?.Address?.locationID).toEqual(testLocationID);
      expect(lead?.Address?.unitNumber).toStrictEqual(testUnitNumber);
    });

    it("picks the status marked as the initial status", async () => {
      LeadStatus.destroy({ truncate: true });
      const [_, initialStatus] = await Promise.all([
        LeadStatus.create({
          title: "Not new",
          isInitial: false,
        }),
        LeadStatus.create({
          title: "New",
          isInitial: true,
        }),
      ]);

      const leadDTO = await service.create(
        { ssoID: ModelFixtureConstants.verifiedSSOID },
        createLeadBaseDTO,
        leadServiceMock,
        {}
      );

      const lead: Lead | null = await Lead.findOne({
        where: {
          id: {
            [Op.eq]: leadDTO.id,
          },
        },
      });

      expect(lead?.statusID).toBe(initialStatus.id);
    });
  });
});
