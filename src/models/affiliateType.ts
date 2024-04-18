export enum AffiliateType {
  AGENCY = "agency",
  INDIVIDUAL = "individual",
  BROKER = "broker",
  AGENT = "agent",
  TITANIUM_AGENCY = "titanium_agency",
}

export enum AffiliateTypeID {
  AGENCY = 1,
  INDIVIDUAL = 2,
  BROKER = 3,
  AGENT = 4,
  TITANIUM_AGENCY = 5,
}

/**
 * Converts from an ID representing an affiliate type to an enum string value.
 *
 * This is done because historically, the available affiliates types are stored
 * in the database.
 *
 * The available list of purposes is finite and high unlikely to change
 * over time. Therefor, we gain in performance what we lose in flexibility.
 */
export const affiliateTypeFromID = (
  affiliateTypeID: AffiliateTypeID | null
): AffiliateType | null => {
  switch (affiliateTypeID) {
    case AffiliateTypeID.AGENCY:
      return AffiliateType.AGENCY;

    case AffiliateTypeID.INDIVIDUAL:
      return AffiliateType.INDIVIDUAL;

    case AffiliateTypeID.BROKER:
      return AffiliateType.BROKER;

    case AffiliateTypeID.AGENT:
      return AffiliateType.AGENT;

    case AffiliateTypeID.TITANIUM_AGENCY:
      return AffiliateType.TITANIUM_AGENCY;

    default:
      return null;
  }
};

/**
 * Converts from an enum string value representing an affiliate type into an ID.
 */
export const affiliateTypeToID = (affiliateType: AffiliateType | null): AffiliateTypeID | null => {
  switch (affiliateType) {
    case AffiliateType.AGENCY:
      return AffiliateTypeID.AGENCY;

    case AffiliateType.INDIVIDUAL:
      return AffiliateTypeID.INDIVIDUAL;

    case AffiliateType.BROKER:
      return AffiliateTypeID.BROKER;

    case AffiliateType.AGENT:
      return AffiliateTypeID.AGENT;

    case AffiliateType.TITANIUM_AGENCY:
      return AffiliateTypeID.TITANIUM_AGENCY;

    default:
      return null;
  }
};
