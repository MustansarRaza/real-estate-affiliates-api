import each from "jest-each";
import { isInternalTestEmailAddress } from "affiliates-api/tools";

describe("isInternalTestEmailAddress", () => {
  const domains = [
    "bayut.com",
    "zameen.com",
    "bproperty.com",
    "lamudi.com",
    "lamudi.co.id",
    "lamudi.ph",
    "prop.pk",
    "empg.com",
    "empgroup.com",
    "mubawab.ma",
    "mubawab.tn",
    "mubawab.dz",
    "olx.com.eg",
    "olx.com.om",
    "kaidee.com",
    "lamudi.com.mx",
    "bayut.sa",
    "bayut.jo",
    "bayut.qa",
    "olx.com.pk",
    "dubizzle.com",
    "sectorlabs.ro",
  ];

  each(domains).it(
    "detects email addresses ending in %s and containing + as internal",
    (domain: string) => {
      expect(isInternalTestEmailAddress(`bla+99@${domain}`)).toBe(true);
    }
  );

  each(domains).it(
    "does not detect email addresses ending in %s and not containing + as internal",
    (domain: string) => {
      expect(isInternalTestEmailAddress(`bla@${domain}`)).toBe(false);
    }
  );

  each(["gmail.com", "outlook.com", "live.com", "hotmail.com", "yahoo.com"]).it(
    "does not detect email addresses ending in %s and containing + as internal",
    (domain: string) => {
      expect(isInternalTestEmailAddress(`bla+99@${domain}`)).toBe(false);
    }
  );
});
