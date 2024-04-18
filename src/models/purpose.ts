export enum Purpose {
  FOR_SALE = "for-sale",
  FOR_RENT = "for-rent",
}

export enum PurposeID {
  FOR_SALE = 1,
  FOR_RENT = 2,
}

/**
 * Converts from an ID representing purpose to an enum string value.
 *
 * This is done because historically, the available purposes are stored
 * in the database. Retrieving the purpose for a listing, project or lead
 * would require yet another join.
 *
 * The available list of purposes is finite and high unlikely to change
 * over time. Therefor, we gain in performance what we lose in flexibility.
 */
export const purposeFromID = (purposeID: PurposeID | null): Purpose | null => {
  switch (purposeID) {
    case PurposeID.FOR_SALE:
      return Purpose.FOR_SALE;

    case PurposeID.FOR_RENT:
      return Purpose.FOR_RENT;

    default:
      return null;
  }
};

/**
 * Converts from an enum string value representing a purpose into an ID.
 */
export const purposeToID = (purpose: Purpose | null): PurposeID | null => {
  switch (purpose) {
    case Purpose.FOR_SALE:
      return PurposeID.FOR_SALE;

    case Purpose.FOR_RENT:
      return PurposeID.FOR_RENT;

    default:
      return null;
  }
};
