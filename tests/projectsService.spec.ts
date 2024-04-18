import { AffiliateCommissionType } from "@pf/taxonomies";
import { ProjectAffiliateVisibilityID, ProjectImage, ProjectStatus } from "affiliates-api/models";
import { ProjectsService } from "affiliates-api/services";
import { AffiliateProjectCommissionDTO } from "affiliates-api/services/commissions";
import each from "jest-each";
import { useMockedServices } from "./support";
import { createProject, createProjectImage, ModelFixtureConstants } from "./support/data";

describe("ProjectsService", () => {
  const mockedServices = useMockedServices();
  const service = new ProjectsService(mockedServices);

  beforeEach(() => {
    jest.resetAllMocks();

    mockedServices.listings.statsGroupedBy.mockReturnValue(Promise.resolve(new Map<number, any>()));
    mockedServices.listings.getSoldListingsCount.mockReturnValue(
      Promise.resolve(new Map<number, number>())
    );
    mockedServices.commissions.getProjectCommissionStats.mockReturnValue(
      Promise.resolve(new Map<number, any>())
    );
    mockedServices.commissions.getCommissionsBreakdownForAffiliate.mockReturnValue(
      Promise.resolve({})
    );
  });

  describe("list", () => {
    it("only lists active projects", async () => {
      const activeProject = await createProject(1, { status: ProjectStatus.ON });
      await createProject(2, { status: ProjectStatus.OFF });

      const projects = await service.list(
        {
          agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        },
        ModelFixtureConstants.verifiedSSOID
      );

      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(activeProject.id);
    });

    it("only lists projects visible for affiliates", async () => {
      await createProject(1, {
        status: ProjectStatus.ON,
        affiliateVisibility: ProjectAffiliateVisibilityID.INVISIBLE,
      });

      const visibleProject = await createProject(2, {
        status: ProjectStatus.ON,
        affiliateVisibility: ProjectAffiliateVisibilityID.VISIBLE,
      });

      const projects = await service.list(
        {
          agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        },
        ModelFixtureConstants.verifiedSSOID
      );

      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(visibleProject.id);
    });

    it("only lists projects linked to the specified agency", async () => {
      await createProject(1, {
        agencyID: 999,
      });

      const visibleProject = await createProject(2, {
        agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
      });

      const projects = await service.list(
        {
          agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        },
        ModelFixtureConstants.verifiedSSOID
      );

      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(visibleProject.id);
    });

    it("cleans 'N.A' from address and converts it into null", async () => {
      const project = await createProject(1, {
        address: "N.A",
      });

      const projects = await service.list(
        {
          agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        },
        ModelFixtureConstants.verifiedSSOID
      );

      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(project.id);
      expect(projects[0].address).toBe(null);
    });

    it("returns images in four variations", async () => {
      const project = await createProject(1);
      const image = await ProjectImage.create({
        projectID: 1,
        title: "my image",
        baseURL: "https://images.zameen.com",
        path: "myimage.jpeg",
      });

      const projects = await service.list(
        {
          agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        },
        ModelFixtureConstants.verifiedSSOID
      );

      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(project.id);
      expect(projects[0].images).toHaveLength(1);
      expect(projects[0].images[0].id).toBe(image.id);
      expect(projects[0].images).toMatchSnapshot();
    });

    it("returns stats about the listings a project has", async () => {
      const project = await createProject(1);

      const listingsStatsPerProject = new Map<number, any>();
      listingsStatsPerProject.set(project.id, {
        count: 45,
        categoryIDs: [3, 4],
        maxPrice: 4,
      });

      const soldListingsCount = 10;
      const soldListingCountPerProject = new Map<number, number>();
      soldListingCountPerProject.set(project.id, soldListingsCount);

      mockedServices.listings.statsGroupedBy.mockReturnValue(
        Promise.resolve(listingsStatsPerProject)
      );

      mockedServices.listings.getSoldListingsCount.mockReturnValue(
        Promise.resolve(soldListingCountPerProject)
      );

      const projects = await service.list(
        {
          agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        },
        ModelFixtureConstants.verifiedSSOID
      );
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(project.id);
      expect(projects[0].listingsStats).toStrictEqual({
        soldCount: soldListingCountPerProject.get(project.id),
        ...listingsStatsPerProject.get(project.id),
      });
    });

    it("returns empty/default stats for a project if it has no listings", async () => {
      const project = await createProject(1);

      const projects = await service.list(
        {
          agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        },
        ModelFixtureConstants.verifiedSSOID
      );
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(project.id);
      expect(projects[0].listingsStats).toStrictEqual({
        count: 0,
        categoryIDs: [],
        minPrice: null,
        maxPrice: null,
        soldCount: 0,
      });
    });

    it("does not include images without a baseURL or path or images that were deleted", async () => {
      const project = await createProject(1);
      const image1 = await createProjectImage(project.id);
      await createProjectImage(project.id, { baseURL: null });
      await createProjectImage(project.id, { path: null });
      await createProjectImage(project.id, { deletedAt: project.createdAt });

      const projects = await service.list(
        {
          agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        },
        ModelFixtureConstants.verifiedSSOID
      );
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(project.id);
      expect(projects[0].images).toHaveLength(1);
      expect(projects[0].images[0].id).toBe(image1.id);
    });

    it("returns empty/default affiliateCommission for a project if there is no affiliate commission associated with it", async () => {
      const project = await createProject(1);

      const projects = await service.list(
        {
          agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        },
        ModelFixtureConstants.verifiedSSOID
      );
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(project.id);
      expect(projects[0].affiliateCommission).toStrictEqual(null);
    });

    it("returns empty/default affiliateCommission stats for a project if there is no affiliate commission associated with it", async () => {
      const project = await createProject(1);

      const projects = await service.list(
        {
          agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        },
        ModelFixtureConstants.verifiedSSOID
      );
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(project.id);
      expect(projects[0].affiliateCommissionStats).toStrictEqual({
        max: null,
        min: null,
      });
    });

    it("returns affiliateCommission stats about the affiliate commissions a project has", async () => {
      const project = await createProject(1);

      const commissionStatsPerProject = new Map<number, any>();
      commissionStatsPerProject.set(project.id, {
        max: 4,
        min: 2.5,
      });

      mockedServices.commissions.getProjectCommissionStats.mockReturnValue(
        Promise.resolve(commissionStatsPerProject)
      );

      const projects = await service.list(
        {
          agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        },
        ModelFixtureConstants.verifiedSSOID
      );
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(project.id);
      expect(projects[0].affiliateCommissionStats).toStrictEqual(
        commissionStatsPerProject.get(project.id)
      );
    });

    it("returns affiliateCommission according to the affiliate commissions records a project has", async () => {
      const project = await createProject(1);

      //@ts-ignore
      const affiliateCommissionPerProject: AffiliateProjectCommissionDTO = {
        [project.id]: {
          [AffiliateCommissionType.FLAT_COMMISSION]: {
            1: [
              {
                id: 189,
                projectId: 1810,
                affiliateTypeId: 1,
                propertyTypeId: 1,
                inventoryType: null,
                inventorySizeFrom: null,
                inventorySizeTo: null,
                startDate: "2021-01-27T19:00:00.000Z",
                endDate: "2022-01-26T19:00:00.000Z",
                createdAt: "2021-01-20T14:46:15.000Z",
                updatedAt: "2021-03-30T06:21:24.000Z",
                createdBy: 483,
                commissionType: "flat_commission",
                downPayment: 30,
                sellingPrice: 91,
                soldUnitsMin: null,
                soldUnitsMax: null,
                commission: 3,
                classifiedCredits: 7.5,
                additionalCommission: null,
                totalCommission: 10.5,
              },
            ],
          },
        },
      };

      mockedServices.commissions.getCommissionsBreakdownForAffiliate.mockReturnValue(
        Promise.resolve(affiliateCommissionPerProject)
      );

      const projects = await service.list(
        {
          agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        },
        ModelFixtureConstants.verifiedSSOID
      );
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(project.id);
      expect(projects[0].affiliateCommission).toStrictEqual(
        affiliateCommissionPerProject[project.id]
      );
    });

    each([
      [new Map<number, any>(), new Map<number, any>()],
      [
        new Map<number, any>().set(1, {
          count: 45,
          categoryIDs: [3, 4],
          maxPrice: 100000,
        }),
        new Map<number, any>(),
      ],
      [
        new Map<number, any>(),
        new Map<number, any>().set(1, {
          max: 4,
          min: 2.5,
        }),
      ],
    ]).it(
      "returns null for the maxEarningPotential if project has empty/default affiliateCommission or listingsStats",
      async (listingsStatsPerProject, commissionStatsPerProject) => {
        const project = await createProject(1);

        mockedServices.listings.statsGroupedBy.mockReturnValue(
          Promise.resolve(listingsStatsPerProject)
        );

        mockedServices.commissions.getDetailsFor.mockReturnValue(
          Promise.resolve(commissionStatsPerProject)
        );

        const projects = await service.list(
          {
            agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
          },
          ModelFixtureConstants.verifiedSSOID
        );
        expect(projects).toHaveLength(1);
        expect(projects[0].id).toBe(project.id);
        expect(projects[0].maxEarningPotential).toStrictEqual(null);
      }
    );

    each([
      [null, null],
      [100000, null],
      [null, 4],
    ]).it(
      "returns null for the maxEarningPotential if any of the two attributes i.e. maxprice(listingStats) and max(affiliateCommision) for the project is null",
      async (maxPrice, maxCommission) => {
        const project = await createProject(1);

        const listingsStatsPerProject = new Map<number, any>();
        listingsStatsPerProject.set(project.id, {
          count: 45,
          categoryIDs: [3, 4],
          maxPrice: maxPrice,
        });

        mockedServices.listings.statsGroupedBy.mockReturnValue(
          Promise.resolve(listingsStatsPerProject)
        );

        const commissionStatsPerProject = new Map<number, any>();
        commissionStatsPerProject.set(project.id, {
          max: maxCommission,
          min: maxCommission,
        });

        mockedServices.commissions.getProjectCommissionStats.mockReturnValue(
          Promise.resolve(commissionStatsPerProject)
        );

        const projects = await service.list(
          {
            agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
          },
          ModelFixtureConstants.verifiedSSOID
        );
        expect(projects).toHaveLength(1);
        expect(projects[0].id).toBe(project.id);
        expect(projects[0].maxEarningPotential).toStrictEqual(null);
      }
    );

    it("returns the correct maxEarningPotential if the two attributes i.e. maxprice(listingStats) and max(affiliateCommision) for the project are not null", async () => {
      const project = await createProject(1);

      const listingsStatsPerProject = new Map<number, any>();
      listingsStatsPerProject.set(project.id, {
        count: 45,
        categoryIDs: [3, 4],
        maxPrice: 100000,
      });

      mockedServices.listings.statsGroupedBy.mockReturnValue(
        Promise.resolve(listingsStatsPerProject)
      );

      const commissionStatsPerProject = new Map<number, any>();
      commissionStatsPerProject.set(project.id, {
        max: 4,
        min: 2.5,
      });

      mockedServices.commissions.getProjectCommissionStats.mockReturnValue(
        Promise.resolve(commissionStatsPerProject)
      );

      const projects = await service.list(
        {
          agencyID: ModelFixtureConstants.verifiedAffiliateAgencyID,
        },
        ModelFixtureConstants.verifiedSSOID
      );
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe(project.id);
      expect(projects[0].maxEarningPotential).toStrictEqual(4000);
    });
  });
});
