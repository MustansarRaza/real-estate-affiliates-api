import { Country, Location } from "affiliates-api/models";
import { LocationsService } from "affiliates-api/services";
import { loadSequelizeFixtures } from "./support";
import { ModelFixtureNames } from "./support/data";

describe("LocationsService", () => {
  const service = new LocationsService();

  describe("list", () => {
    it("orders by level and returns type ID based on level", async () => {
      const country = await Location.create({
        name: "Netherlands",
        parentID: null,
        level: 1,
      });

      const region = await Location.create({
        name: "Gelderland",
        parentID: country.id,
        level: 2,
      });

      const city = await Location.create({
        name: "Ede",
        parentID: region.id,
        level: 3,
      });

      const locations = await service.list();
      expect(locations).toMatchObject([
        {
          id: country.id,
          name: country.name,
          parentID: null,
          typeID: 0,
        },
        {
          id: region.id,
          name: region.name,
          parentID: country.id,
          typeID: 1,
        },
        {
          id: city.id,
          name: city.name,
          parentID: region.id,
          typeID: 2,
        },
      ]);
    });

    it("returns undefined for typeID if not available", async () => {
      const loc = await Location.create({
        name: "Random",
        parentID: null,
        level: 4,
      });

      const locations = await service.list();
      expect(locations).toHaveLength(1);
      expect(locations[0].id).toBe(loc.id);
      expect(locations[0].typeID).toBe(undefined);
    });

    it("returns undefined for iso31662Code if not available", async () => {
      const loc = await Location.create({
        name: "Pakistan",
        parentID: null,
        level: 1,
      });

      const locations = await service.list();
      expect(locations).toHaveLength(1);
      expect(locations[0].id).toBe(loc.id);
      expect(locations[0].iso31662Code).toBe(undefined);
    });

    it("returns undefined for iso31662Code if not a country", async () => {
      const country = await Country.create({
        name: "Pakistan",
        iso31662Code: "PK",
      });

      // is in Pakistan, but is not a country node, should
      // not get a ISO31662 code
      const loc = await Location.create({
        name: "Random",
        parentID: null,
        level: 4,
        countryID: country.id,
      });

      const locations = await service.list();
      expect(locations).toHaveLength(1);
      expect(locations[0].id).toBe(loc.id);
      expect(locations[0].iso31662Code).toBe(undefined);
    });

    it("returns ISO31662 code for country level nodes", async () => {
      const country = await Country.create({
        name: "Pakistan",
        iso31662Code: "PK",
      });

      const loc = await Location.create({
        name: "Pakistan",
        parentID: null,
        countryID: country.id,
        level: 1,
      });

      const locations = await service.list();
      expect(locations).toHaveLength(1);
      expect(locations[0].id).toBe(loc.id);
      expect(locations[0].iso31662Code).toBe("PK");
    });
  });

  describe("getWithHierarchy", () => {
    it("gets a location with hierarchy data", async () => {
      const countryLocation = await Location.create({
        name: "Pakistan",
        parentID: null,
        level: 1,
      });

      const location = await Location.create({
        name: "Punjab",
        parentID: 1,
        level: 2,
        level1LocationID: countryLocation.id,
      });

      const dto = await service.getWithHierarchy({ locationID: location.id });
      expect(dto).toMatchSnapshot();
    });

    it("returns null if no such location exists", async () => {
      const dto = await service.getWithHierarchy({ locationID: 999 });
      expect(dto).toBe(null);
    });
  });

  describe("getlocationCityIDMapping", () => {
    it("gets a Map having cityId against the location", async () => {
      await loadSequelizeFixtures(ModelFixtureNames.COUNTRIES, ModelFixtureNames.LOCATIONS);

      const location = await Location.create({
        name: "Gajju Matta",
        parentID: 3,
        level: 4,
        level1LocationID: 1,
        level3LocationID: 3,
      });

      const locationCityIdMap = await service.getLocationToCityIDMapping([location.id]);
      expect(locationCityIdMap.size).toEqual(1);
      expect(locationCityIdMap.get(location.id)).toEqual(3);
    });

    it("returns empty mapping if there is no locationId provided", async () => {
      await loadSequelizeFixtures(ModelFixtureNames.COUNTRIES, ModelFixtureNames.LOCATIONS);

      const locationCityIdMap = await service.getLocationToCityIDMapping([]);
      expect(locationCityIdMap.size).toBe(0);
    });
  });

  describe("countryID", () => {
    it("returns the countryID for a locationID", async () => {
      const country = await Country.create({
        name: "Netherlands",
      });

      const location = await Location.create({
        name: "Ede",
        parentID: null,
        countryID: country.id,
        level: 1,
      });

      const countryID = await service.countryID({ locationID: location.id });
      expect(countryID).toBe(country.id);
    });

    it("returns null if the location has no countryID", async () => {
      const location = await Location.create({
        name: "Ede",
        parentID: null,
        countryID: null,
        level: 1,
      });

      const countryID = await service.countryID({ locationID: location.id });
      expect(countryID).toBe(null);
    });

    it("throws an error if the location could not be found", async () => {
      const countryID = await service.countryID({ locationID: 1337 });
      expect(countryID).toBe(null);
    });
  });
});
