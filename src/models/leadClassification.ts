export enum LeadClassificationID {
  VERY_HOT = 1,
  HOT = 2,
  MODERATE = 3,
  COLD = 4,
  VERY_COLD = 5,
}

export enum LeadClassification {
  VERY_HOT = "veryHot",
  HOT = "hot",
  MODERATE = "moderate",
  COLD = "cold",
  VERY_COLD = "veryCold",
}

/**
 * Converts from an ID representing a classification to an enum string value.
 *
 * This is done because historically, the available classifications are stored
 * in the database. Retrieving the purpose for a listing, project or lead
 * would require yet another join.
 *
 * The available list of classifications is finite and high unlikely to change
 * over time. Therefor, we gain in performance what we lose in flexibility.
 */
export const leadClassificationFromID = (
  classificationID: LeadClassificationID | null
): LeadClassification | null => {
  switch (classificationID) {
    case LeadClassificationID.VERY_HOT:
      return LeadClassification.VERY_HOT;

    case LeadClassificationID.HOT:
      return LeadClassification.HOT;

    case LeadClassificationID.MODERATE:
      return LeadClassification.MODERATE;

    case LeadClassificationID.COLD:
      return LeadClassification.COLD;

    case LeadClassificationID.VERY_COLD:
      return LeadClassification.VERY_COLD;

    default:
      return null;
  }
};

/**
 * Converts from an enum string value representing a classification into an ID.
 */
export const leadClassificationToID = (
  classification: LeadClassification | null
): LeadClassificationID | null => {
  switch (classification) {
    case LeadClassification.VERY_HOT:
      return LeadClassificationID.VERY_HOT;

    case LeadClassification.HOT:
      return LeadClassificationID.HOT;

    case LeadClassification.MODERATE:
      return LeadClassificationID.MODERATE;

    case LeadClassification.COLD:
      return LeadClassificationID.COLD;

    case LeadClassification.VERY_COLD:
      return LeadClassificationID.VERY_COLD;

    default:
      return null;
  }
};
