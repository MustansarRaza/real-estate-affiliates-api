import {
  Country,
  Location,
  LocationLevel,
  LocationLevelTitle,
  LocationPopularityIndex,
} from "affiliates-api/models";
import { get } from "lodash";
import { Op } from "sequelize";

enum LocationTypeID {
  COUNTRY = 0,
  REGION = 1,
  CITY = 2,
}

interface LocationDTO {
  id: number;
  name: string;
  parentID: number | null;

  /**
   * Helps the client figure out whether this is a country, city or
   * region. Without this, the client would have to make assumptions
   * about the levels. However, the levels differ per country. For
   * example, Dubai is both a city and a region, so its one node on
   * level 2.
   *
   * Right now, level == typeID, but this allows us to easily change
   * how the levels work without breaking clients.
   */
  typeID?: LocationTypeID;

  /**
   * Number showing the ranking of the node, only returned for
   * city level nodes uptill now(i.e. typeID == 2) will need it
   * for the other locations in future.
   */
  popularityIndex?: number;

  /**
   * Two-digit code, only returned for country level nodes.
   */
  iso31662Code?: string;
}

interface LocationWithHierarchyDTO extends LocationDTO {
  level1Location: LocationDTO | null;
}

interface ByLocationID {
  locationID: number;
}

/**
 * Provides access to locations.
 */
class LocationsService {
  /**
   * Gets a list of all available locations.
   */
  async list(): Promise<LocationDTO[]> {
    const locations = await Location.findAll({
      attributes: ["id", "name", "parentID", "level", "levelTitle"],
      order: [
        ["cat_level", "ASC"],
        ["title", "ASC"],
        ["cat_id", "ASC"],
      ],
      include: [
        {
          model: Country,
          required: false,
          attributes: ["iso31662Code"],
        },
      ],
    });

    return locations.map((location: Location) => this.serialize(location));
  }

  /**
   * Gets a single location by ID with extended hierarchy data.
   */
  async getWithHierarchy({ locationID }: ByLocationID): Promise<LocationWithHierarchyDTO | null> {
    const location = await Location.findOne({
      attributes: ["id", "name", "parentID", "level"],
      where: {
        id: {
          [Op.eq]: locationID,
        },
      },
      include: [
        {
          model: Country,
          required: false,
          attributes: ["iso31662Code"],
        },
        {
          model: Location,
          as: "Level1Location",
          required: false,
        },
      ],
    });

    if (!location) {
      return null;
    }

    return this.serializeWithHierarchy(location);
  }

  /**
   * Looks up the country ID for the specified location ID.
   *
   * `countryID` refers to the ID of a record in `zn_countries`.
   * `zn_countries` is deprecated, but for backwards compatibility
   * reasons, we still have to insert the `countryID` in some tables.
   * Hence this lookup.
   */
  async countryID({ locationID }: ByLocationID): Promise<number | null> {
    const location = await Location.findOne({
      attributes: ["countryID"],
      where: {
        id: {
          [Op.eq]: locationID,
        },
      },
    });

    if (!location || !location.countryID) {
      return null;
    }

    return location.countryID;
  }

  /**
   * @param locationIDs { number[] } against which the cityIds are required
   * @returns Promise of a Map having cityId against each locationId
   */
  async getLocationToCityIDMapping(locationIDs: number[]): Promise<Map<number, number | null>> {
    const locationToCityIdMap = new Map<number, number | null>();

    if (locationIDs?.length === 0) return locationToCityIdMap;
    const locations = await Location.findAll({
      attributes: ["id", "level3LocationID"],
      where: {
        id: {
          [Op.in]: locationIDs,
        },
      },
    });

    locations.forEach((location: Location) => {
      locationToCityIdMap.set(location.id, location.level3LocationID);
    });

    return locationToCityIdMap;
  }

  /**
   * Serializes a queried {@see Location} model instance with extended
   * hierarchy data into a DTO.
   */
  private serializeWithHierarchy(location: Location): LocationWithHierarchyDTO {
    return {
      ...this.serialize(location),
      level1Location: location.Level1Location ? this.serialize(location.Level1Location) : null,
    };
  }

  /**
   * Serializes a queried {@see Location} model instance into a DTO.
   */
  private serialize(location: Location): LocationDTO {
    return {
      id: location.id,
      name: location.name,
      parentID: location.parentID,
      typeID: this.serializeTypeID(location),
      popularityIndex: this.serializePopularityIndex(location),
      iso31662Code: this.serializeISO31662Code(location),
    };
  }

  /**
   * Serializes a ISO31662 code (two-digit code) describring the country this
   * location node is in.
   *
   * To save precious bandwidth in the response, we serialize this only for
   * country-level nodes and do not include the key at all in non-country nodes.
   */
  private serializeISO31662Code(location: Location): string | undefined {
    // we only serialize this for countries, other nodes could technically have it
    // as well, but then we'd be wasting precious bandwidth
    if (location.level !== LocationLevel.COUNTRY) {
      return undefined;
    }

    const code = location.Country?.iso31662Code;
    return code || undefined;
  }

  /**
   * Serializes a stable identifier to help clients figure out what type
   * of location this.
   *
   * Clients can use this instead of having to guess based on the `level`.
   * The way levels are structured _might_ be different for each country.
   * At the moment we don't do anything complex here. We're just avoiding
   * the client making assumptions about the structure of the tree.
   *
   * This is serialized as `undefined` so that locations without a typeID
   * don't have an empty field in the response. We're returning thousands
   * of node so this saves bytes in the response.
   */
  private serializeTypeID(location: Location): LocationTypeID | undefined {
    switch (location.level) {
      case LocationLevel.COUNTRY:
        return LocationTypeID.COUNTRY;

      case LocationLevel.REGION:
        return LocationTypeID.REGION;

      case LocationLevel.CITY:
        return LocationTypeID.CITY;

      default:
        return undefined;
    }
  }

  /**
   * Serializes Popularity Index to tell the ranking of a city uptill
   * now and will need it for other locations in future maybe.
   *
   * This is serialized as `undefined` so that locations which are not
   * cities don't have an empty field in the response. We're returning
   * thousands of node so this saves bytes in the response.
   */
  private serializePopularityIndex(location: Location): number | undefined {
    if (location.levelTitle === LocationLevelTitle.CITY)
      return location.name in LocationPopularityIndex.CITY
        ? get(LocationPopularityIndex.CITY, location.name)
        : LocationPopularityIndex.NOTPOPULAR;
    return undefined;
  }
}

export default LocationsService;
