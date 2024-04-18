import {
  ContractListingIsDeleted,
  ContractStageId,
  ContractStatusKey,
  ListingStatusKey,
} from "@pf/taxonomies";
import { createAWSS3ReadPresignedURL } from "affiliates-api/aws";
import {
  Address,
  AreaUnit,
  areaUnitFromID,
  Contract,
  ContractListing,
  ContractStatus,
  Listing,
  ListingAgainstType,
  ListingAllocationID,
  ListingCommissionType,
  ListingImage,
  ListingImageCategory,
  ListingStatus,
  ListingStatusID,
  ListingVisibilityID,
  MediaBankImage,
  Purpose,
  purposeFromID,
} from "affiliates-api/models";
import { ISO8601DateTime } from "affiliates-api/types";
import Sequelize, { Op, WhereOptions } from "sequelize";
import MeService from "./me";

interface ListingAgainstDTO {
  type: ListingAgainstType;
  id: number;
}

interface ListingCommissionDTO {
  type: ListingCommissionType;
  value: number;
}

interface ListingPriceDTO {
  value: number;
}

interface ListingAreaValueDTO {
  covered: number | null;
  free: number | null;
  total: number | null;
}

interface ListingAreaDTO {
  unit: AreaUnit;
  value: ListingAreaValueDTO;
}

interface ListingImageDTO {
  id: number;
  url: string;
  displayOrder: number;
  category: ListingImageCategory;
}

export interface ListingDTO {
  id: number;
  against: ListingAgainstDTO;
  price: ListingPriceDTO | null;
  maxDiscountPercentage: number | null;
  agencyID: number | null;
  unitNumber: string | null;
  purpose: Purpose | null;
  categoryID: number | null;
  locationID: number | null;
  bedroomCount: number | null;
  bathroomCount: number | null;
  area: ListingAreaDTO | null;
  commission: ListingCommissionDTO | null;
  url: string | null;
  images: ListingImageDTO[];
  createdAt: ISO8601DateTime;
  updatedAt: ISO8601DateTime;
}

export interface ListingsStatsDTO {
  count: number;
  minPrice: number | null;
  maxPrice: number | null;
  categoryIDs: number[];
}

type ByAgencyIDLookup = {
  agencyID: number;
};

type ByListingIDLookup = {
  listingID: number;
};

type ByAgainstIDLookup = {
  againstType?: ListingAgainstType;
  againstID?: number;
  againstIDs?: number[];
};
export type ByFiltersLookup = {
  categoryIDs?: number[] | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minArea?: number | null;
  maxArea?: number | null;
};

type ListingsLookupOptions = ByAgencyIDLookup & ByAgainstIDLookup & ByFiltersLookup;

interface OtherServices {
  me: MeService;
}

/**
 * Provides access to listings.
 */
class ListingsService {
  constructor(private services: OtherServices) {}

  /**
   * Lists all listings available for affiliates matching the
   * specified filters.
   */
  async list(options: ListingsLookupOptions): Promise<ListingDTO[]> {
    const listings = await Listing.findAll({
      where: {
        [Op.and]: this.createFiltersForActiveListings(options),
      },
      include: [
        {
          model: Address,
          required: false,
        },
        {
          model: ListingImage,
          required: false,
          attributes: ["id", "category", "displayOrder"],
          where: {
            isDeleted: {
              [Op.eq]: false,
            },
          },
          include: [
            {
              model: MediaBankImage,
              required: false,
              attributes: ["key"],
            },
          ],
          order: [
            ["display_order", "ASC"],
            ["id", "DESC"],
          ],
        },
      ],
      order: [
        ["unit_number", "ASC"],
        ["listing_id", "DESC"],
      ],
    });

    return listings.map((listing: Listing) => this.serialize(listing));
  }

  /**
   * Finds an active listing by id & agencyID visible to affiliates
   * @param listingID
   * @param agencyID
   */
  async find({
    listingID,
    agencyID,
  }: ByAgencyIDLookup & ByListingIDLookup): Promise<ListingDTO | null> {
    const listing = await Listing.findOne({
      where: {
        [Op.and]: [
          ...this.createFiltersForActiveListings({ agencyID }),
          { id: { [Op.eq]: listingID } },
        ],
      },
    });
    return listing ? this.serialize(listing) : null;
  }

  /**
   * Collects aggregate data for listings grouped by against type and ID.
   */
  async statsGroupedBy(options: ListingsLookupOptions): Promise<Map<number, ListingsStatsDTO>> {
    const queryRows = (await Listing.findAll({
      attributes: [
        ["listing_against_id", "againstID"],
        [Sequelize.fn("COUNT", "*"), "count"],
        [Sequelize.fn("MIN", Sequelize.col("price")), "minPrice"],
        [Sequelize.fn("MAX", Sequelize.col("price")), "maxPrice"],
        [Sequelize.fn("GROUP_CONCAT", Sequelize.literal("DISTINCT `type_id`")), "categoryIDs"],
      ],
      where: {
        [Op.and]: this.createFiltersForActiveListings(options),
      },
      group: ["againstID"],
      raw: true,
    })) as {
      againstID: number;
      count: number;
      minPrice: number | null;
      maxPrice: number | null;
      categoryIDs: string;
    }[];

    const statsGroupedBy = new Map<number, ListingsStatsDTO>();
    queryRows.forEach(({ againstID, count, minPrice, maxPrice, categoryIDs }) => {
      statsGroupedBy.set(againstID, {
        count,
        minPrice,
        maxPrice,
        categoryIDs: categoryIDs
          ? categoryIDs.split(",").map((categoryID) => Number(categoryID))
          : [],
      });
    });

    return statsGroupedBy;
  }

  /**
   * @param agencyId { number }to include the listings that belongs to the agencyId provided
   * @param againstIds { number[] } to include the listings of the provided projects
   *
   * @returns a { Map<number, number> } in which there is the count of sold units against a projectId
   */
  public async getSoldListingsCount(
    agencyId: number,
    againstIds: number[]
  ): Promise<Map<number, number>> {
    const queryRows = (await Listing.findAll({
      attributes: [
        ["listing_against_id", "againstID"],
        [Sequelize.fn("COUNT", "*"), "count"],
      ],
      where: {
        agencyID: {
          [Op.eq]: agencyId,
        },
        againstID: {
          [Op.in]: againstIds,
        },
      },
      include: [
        {
          model: ListingStatus,
          required: true,
          attributes: [],
          where: {
            key: {
              [Op.in]: [
                ListingStatusKey.PARTIAL_DOWN_PAYMENT,
                ListingStatusKey.COMPLETE_DOWN_PAYMENT,
                ListingStatusKey.SOLD_CLOSED_WON,
              ],
            },
          },
        },
        {
          model: ContractListing,
          attributes: [],
          required: true,
          where: {
            isDeleted: {
              [Op.eq]: ContractListingIsDeleted.False,
            },
          },
          include: [
            {
              model: Contract,
              attributes: [],
              required: true,
              where: {
                stage: {
                  [Op.in]: [
                    ContractStageId.SOLD,
                    ContractStageId.COMPLETE_DOWN_PAYMENT,
                    ContractStageId.PARTIAL_DP,
                  ],
                },
              },
              include: [
                {
                  model: ContractStatus,
                  required: true,
                  attributes: [],
                  where: {
                    key: {
                      [Op.ne]: ContractStatusKey.CANCELLED,
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
      group: ["againstID"],
      raw: true,
    })) as {
      againstID: number;
      count: number;
    }[];

    const countsGroupedBy = new Map<number, number>();
    queryRows.forEach(({ againstID, count }) => {
      countsGroupedBy.set(againstID, count);
    });

    return countsGroupedBy;
  }

  /**
   * Gets the filters to use to get active listings that
   * are not allocated yet and are visible for affiliates.
   */
  private createFiltersForActiveListings(options: ListingsLookupOptions): WhereOptions[] {
    const filters: WhereOptions[] = [
      {
        statusID: {
          [Op.eq]: ListingStatusID.AVAILABLE,
        },
        visibilityID: {
          [Op.in]: [ListingVisibilityID.STAFF_AFFILIATE, ListingVisibilityID.AFFILIATE],
        },
        allocationID: {
          [Op.in]: [ListingAllocationID.OPEN, ListingAllocationID.INVESTOR_QUOTA],
        },
        agencyID: {
          [Op.eq]: options.agencyID,
        },
      },
    ];

    if (options?.againstType) {
      filters.push({
        againstType: {
          [Op.eq]: options.againstType,
        },
      });
    }

    if (options?.againstID) {
      filters.push({
        againstID: {
          [Op.eq]: options.againstID,
        },
      });
    }

    if (options?.againstIDs) {
      filters.push({
        againstID: {
          [Op.in]: options.againstIDs,
        },
      });
    }
    if (options?.minPrice) {
      filters.push({
        price: {
          [Op.gte]: options.minPrice,
        },
      });
    }
    if (options?.maxPrice) {
      filters.push({
        price: {
          [Op.lte]: options.maxPrice,
        },
      });
    }
    if (options?.minArea) {
      filters.push({
        areaTotal: {
          [Op.gte]: options.minArea,
        },
      });
    }
    if (options?.maxArea) {
      filters.push({
        areaTotal: {
          [Op.lte]: options.maxArea,
        },
      });
    }
    if (options?.categoryIDs?.length) {
      filters.push({
        categoryID: {
          [Op.in]: options.categoryIDs,
        },
      });
    }

    return filters;
  }

  /**
   * Serializes the specified listing into a DTO.
   */
  private serialize(listing: Listing): ListingDTO {
    const images = listing.ListingImages?.filter(
      (listingImage: ListingImage) => listingImage.MediaBankImage
    ).map((listingImage: ListingImage, index: number) => ({
      id: listingImage.id,
      url: createAWSS3ReadPresignedURL(listingImage.MediaBankImage!.key),
      displayOrder: listingImage.displayOrder || index,
      category: listingImage.category,
    }));

    return {
      id: listing.id,
      against: {
        type: listing.againstType,
        id: listing.againstID,
      },
      price: listing.price
        ? {
            value: listing.price,
          }
        : null,
      maxDiscountPercentage: listing.maxDiscountPercentage,
      agencyID: listing.agencyID,
      unitNumber: listing.unitNumber,
      purpose: purposeFromID(listing.purposeID),
      categoryID: listing.categoryID,
      locationID: this.serializeLocationID(listing.Address),
      bedroomCount: listing.bedroomCount,
      bathroomCount: listing.bathroomCount,
      area: this.serializeArea(listing),
      commission: this.serializeCommission(listing.commissionType, listing.commissionValue),
      url: listing.url || null,
      images: images,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    };
  }

  private serializeLocationID(address: Address | null): number | null {
    if (!address) {
      return null;
    }

    // we want the ID of the leaf location node, which should be stored
    // in the `locationID` field... however, the vast majority of the
    // listings do not have this set, which means we have to do this
    // long fallback chain to discover ID of the leaf node
    return (
      address.locationID ||
      address.phaseLocationID ||
      address.localityLocationID ||
      address.cityLocationID ||
      address.regionLocationID ||
      address.countryLocationID ||
      null
    );
  }

  private serializeArea(listing: Listing): ListingAreaDTO | null {
    const { areaCovered, areaFree, areaTotal } = listing;

    if (!areaCovered && !areaFree && !areaTotal) {
      return null;
    }

    // the db does not always store the total, we can easily compute it
    const total = areaTotal ? areaTotal : (areaCovered || 0) + (areaFree || 0);

    return {
      unit: areaUnitFromID(listing.areaUnitID) || AreaUnit.SQFT,
      value: {
        covered: areaCovered,
        free: areaFree,
        total: total,
      },
    };
  }

  private serializeCommission(
    commissionType: ListingCommissionType | null,
    commissionValue: number | null
  ): ListingCommissionDTO | null {
    if (!commissionValue) {
      return null;
    }

    const defaultCommissionType = ListingCommissionType.PERCENTAGE;

    return {
      type: commissionType || defaultCommissionType,
      value: commissionValue,
    };
  }
}

export default ListingsService;
