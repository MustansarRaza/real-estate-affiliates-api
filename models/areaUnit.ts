export enum AreaUnit {
  SQM = "sqm",
  KANAL = "kanal",
  SQYD = "sqyd",
  SQFT = "sqft",
  MARLA = "marla",
}

export enum AreaUnitID {
  SQM = 1,
  KANAL = 2,
  SQYD = 3,
  SQFT = 4,
  MARLA = 5,
}

/**
 * Converts from an ID representing an area unit to an enum string value.
 *
 * This is done because historically, the available area units are stored
 * in the database. Retrieving the area unit for a listing, project or lead
 * would require yet another join.
 *
 * The available list of area units is finite and high unlikely to change
 * over time. Therefor, we gain in performance what we lose in flexibility.
 */
export const areaUnitFromID = (areaUnitID: AreaUnitID | null): AreaUnit | null => {
  switch (areaUnitID) {
    case AreaUnitID.SQM:
      return AreaUnit.SQM;

    case AreaUnitID.KANAL:
      return AreaUnit.KANAL;

    case AreaUnitID.SQYD:
      return AreaUnit.SQYD;

    case AreaUnitID.SQFT:
      return AreaUnit.SQFT;

    case AreaUnitID.MARLA:
      return AreaUnit.MARLA;

    default:
      return null;
  }
};
