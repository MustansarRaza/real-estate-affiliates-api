import { config } from "./config";

export const isSentryEnabled = (): boolean => !!config.get("sentry").dsn;

export const isCachingEnabled = (): boolean => !!config.get("cache").url;

export const getDbTimezone = (): string | null => config.get("dbTimezone");

export const getMaxActiveAffiliateReservations = (): number =>
  config.get("maxActiveAffiliateReservations");
