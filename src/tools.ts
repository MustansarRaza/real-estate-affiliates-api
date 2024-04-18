/**
 * Gets whether the speciifed e-mail address belongs to one
 * one of the EMPG companies.
 *
 * We use this to mark such accounts as "test" accounts.
 */
export const isInternalTestEmailAddress = (email: string): boolean =>
  !!new RegExp(
    "(.+)\\+([0-9]+)@(bayut|zameen|bproperty|lamudi|empg|empgroup|mubawab|prop|olx|kaidee|sectorlabs|dubizzle).(com|com.pk|com.eg|com.om|com.mx|co.id|ph|pk|sa|jo|qa|dz|tn|ma|mx|ro)$",
    "i"
  ).exec(email);
