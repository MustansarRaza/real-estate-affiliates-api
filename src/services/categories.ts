import { ListingStatusKey, PlatformKey } from "@pf/taxonomies";
import {
  Address,
  AgencyConfiguration,
  Category,
  Listing,
  ListingStatus,
  Location,
  Platform,
  popularCategoryKeyToIndex,
  Project,
  ProjectAffiliateVisibilityID,
  ProjectStatus,
} from "affiliates-api/models";
import { col, fn, Op } from "sequelize";

interface CategoryAvailabilityDTO {
  availableInCities: CategoryCityAvailabilityDTO[];
  availableInProjects: number[];
}

interface CategoryCityAvailabilityDTO {
  cityID: number;
  unitsCount: number;
}

interface CategoryDTO {
  id: number;
  name: string;
  nameSingular: string;
  orderIndex: number;
  slug: string;
  parentID: number | null;
  popularityIndex: number;
  availableInCities: CategoryCityAvailabilityDTO[];
  availableInProjects: number[];
}

/**
 * Provides access to categories.
 */
class CategoriesService {
  /**
   * Gets a list of all available categories.
   */
  async list(agencyID: number | null): Promise<CategoryDTO[]> {
    let platformId = null;

    if (agencyID) {
      const agencyConfig = await AgencyConfiguration.findOne({
        attributes: ["platformId"],
        where: { agencyId: { [Op.eq]: agencyID } },
        raw: true,
      });
      platformId = agencyConfig?.platformId;
    }
    if (!platformId) {
      const platform = await Platform.findOne({
        attributes: ["id"],
        where: { platformKey: { [Op.eq]: PlatformKey.ZAMEEN } },
        raw: true,
      });
      platformId = platform.id;
    }

    const categories = await Category.findAll({
      where: { platformId: { [Op.eq]: platformId } },
      order: [
        ["type_order", "ASC"],
        ["type_id", "ASC"],
      ],
    });

    const categoryCitiesAndProjectsMap = await this.getCategoryCitiesAndProjectsMap(agencyID);

    return categories.map((category: Category) => ({
      id: category.id,
      name: category.name,
      nameSingular: category.nameSingular,
      orderIndex: category.orderIndex,
      slug: category.slug,
      parentID: category.parentID,
      popularityIndex: popularCategoryKeyToIndex(category.key),
      availableInCities: categoryCitiesAndProjectsMap[category.id]?.availableInCities || [],
      availableInProjects: categoryCitiesAndProjectsMap[category.id]?.availableInProjects || [],
    }));
  }

  /**
   * Gets a map of cities and Projects against a category in which
   * that category is available.
   */
  private async getCategoryCitiesAndProjectsMap(
    agencyID: number | null
  ): Promise<{
    [propertTypeId: number]: CategoryAvailabilityDTO;
  }> {
    const categoriesAvailablityResult = await Listing.findAll({
      attributes: [[fn("COUNT", "id"), "Count"]],
      include: [
        {
          model: ListingStatus,
          attributes: [],
          where: {
            key: {
              [Op.eq]: ListingStatusKey.AVAILABLE,
            },
          },
          required: true,
        },
        {
          model: Category,
          attributes: ["id"],
          required: true,
        },
        {
          model: Project,
          required: true,
          attributes: ["id"],
          where: {
            status: {
              [Op.eq]: ProjectStatus.ON,
            },
            affiliateVisibility: {
              [Op.eq]: ProjectAffiliateVisibilityID.VISIBLE,
            },
            ...(agencyID && {
              agencyID: {
                [Op.eq]: agencyID,
              },
            }),
          },
          include: [
            {
              model: Address,
              required: true,
              attributes: [],
              include: [
                {
                  model: Location,
                  attributes: ["id"],
                  required: true,
                },
              ],
            },
          ],
        },
      ],
      group: [
        col("Category.type_id"),
        col("Project.Address.Location.title"),
        col("Project.project_id"),
      ],
      raw: true,
    });

    const categoryCitiesAndProjectsMap: { [propertTypeId: number]: CategoryAvailabilityDTO } = {};
    categoriesAvailablityResult.forEach((row: any) => {
      const propertyTypeId = row["Category.id"];
      const projectID = row["Project.id"];
      const cityID = row["Project.Address.Location.id"];
      const unitsCount = row["Count"];

      if (categoryCitiesAndProjectsMap.hasOwnProperty(propertyTypeId)) {
        categoryCitiesAndProjectsMap[propertyTypeId].availableInProjects.push(projectID);
        const index = categoryCitiesAndProjectsMap[propertyTypeId].availableInCities
          .map((city: CategoryCityAvailabilityDTO) => city.cityID)
          .indexOf(cityID);
        if (index === -1) {
          categoryCitiesAndProjectsMap[propertyTypeId].availableInCities.push({
            cityID,
            unitsCount,
          });
        } else {
          categoryCitiesAndProjectsMap[propertyTypeId].availableInCities[
            index
          ].unitsCount += unitsCount;
        }
      } else {
        categoryCitiesAndProjectsMap[propertyTypeId] = {
          availableInProjects: [projectID],
          availableInCities: [{ cityID, unitsCount }],
        };
      }
    });

    return categoryCitiesAndProjectsMap;
  }
}

export default CategoriesService;
