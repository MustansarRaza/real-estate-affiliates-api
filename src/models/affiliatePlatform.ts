export enum AffiliatePlatform {
  STAFF_APP = "staff_app",
  WEB_APP = "propforce.com",
  MOBILE_APP = "propforce_mobile_app",
}

export enum AffiliatePlatformID {
  STAFF_APP = 1,
  WEB_APP = 2,
  MOBILE_APP = 3,
}

/**
 * Converts from an enum string value representing an affiliate platform into an ID.
 */
export const affiliatePlatformToID = (
  affiliatePlatform: AffiliatePlatform | null
): AffiliatePlatformID | null => {
  switch (affiliatePlatform) {
    case AffiliatePlatform.STAFF_APP:
      return AffiliatePlatformID.STAFF_APP;

    case AffiliatePlatform.WEB_APP:
      return AffiliatePlatformID.WEB_APP;

    case AffiliatePlatform.MOBILE_APP:
      return AffiliatePlatformID.MOBILE_APP;

    default:
      return null;
  }
};
