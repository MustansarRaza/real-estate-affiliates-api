import { AffiliateAppSourceType } from "@pf/taxonomies";
import { isE164PhoneNumber, validate } from "@pf/utils";
import { AffiliatePlatform, AffiliateType, GovIDType } from "affiliates-api/models";
import {
  formatPhoneNumberToE164,
  removeAllSpaces,
  removeConsecutiveSpaces,
  removeDashes,
} from "affiliates-api/sanitization";
import { CreateMeDTO, useServices } from "affiliates-api/services";
import { Request, RequestHandler, Response } from "express";
import { body, matchedData } from "express-validator";

export const createMe = [
  validate([
    body("profile.email")
      .exists()
      .trim()
      .customSanitizer(removeAllSpaces)
      .not()
      .isEmpty()
      // Only convert the local part of the e-mail
      // address to lower-case, leave the rest as is.
      //
      // Although test@gmail.com and test+1@gmail.com
      // are the same thing as far as Gmail is concerned,
      // we can't remove that distinction. The user signs
      // up with test+1@gmail.com and expects to log in like
      // that.
      //
      // Lower-casing the email address is ok. When signed
      // up with test@gmail.com, you'll be able to log in
      // with TEST@gmail.com as well.
      .normalizeEmail({
        all_lowercase: true,
        gmail_lowercase: false,
        gmail_remove_dots: false,
        gmail_remove_subaddress: false,
        gmail_convert_googlemaildotcom: false,
        outlookdotcom_lowercase: false,
        outlookdotcom_remove_subaddress: false,
        yahoo_lowercase: false,
        yahoo_remove_subaddress: false,
        icloud_lowercase: false,
        icloud_remove_subaddress: false,
      })
      .isEmail(),
    body("profile.givenName")
      .exists()
      .trim()
      .customSanitizer(removeConsecutiveSpaces)
      .not()
      .isEmpty(),
    body("profile.familyName")
      .exists()
      .trim()
      .customSanitizer(removeConsecutiveSpaces)
      .not()
      .isEmpty(),
    body("profile.mobilePhoneNumbers").isArray({ min: 1, max: 1 }),
    body("profile.mobilePhoneNumbers.*")
      .trim()
      .customSanitizer(removeAllSpaces)
      .customSanitizer(formatPhoneNumberToE164)
      .not()
      .isEmpty()
      .custom(isE164PhoneNumber),
    body("profile.landLinePhoneNumbers").isArray({ min: 0, max: 1 }),
    body("profile.landLinePhoneNumbers.*")
      .trim()
      .customSanitizer(removeAllSpaces)
      .customSanitizer(formatPhoneNumberToE164)
      .not()
      .isEmpty()
      .custom(isE164PhoneNumber),
    body("profile.address")
      .exists()
      .trim()
      .customSanitizer(removeConsecutiveSpaces)
      .not()
      .isEmpty(),
    body("profile.govIDType")
      .exists()
      .isIn(Object.values(GovIDType)),
    body("profile.govIDNumber")
      .exists()
      .trim()
      .customSanitizer(removeAllSpaces)
      .customSanitizer(removeDashes)
      .not()
      .isEmpty()
      .isLength({ min: 13, max: 13 })
      .isInt(),
    body("profile.taxNumber")
      .exists()
      .optional({ nullable: true })
      .trim()
      .customSanitizer(removeAllSpaces)
      .customSanitizer(removeDashes)
      .not()
      .isEmpty()
      .isLength({ min: 8, max: 8 })
      .isInt(),
    body("profile.businessName")
      .exists()
      .optional({ nullable: true })
      .trim()
      .customSanitizer(removeConsecutiveSpaces)
      .not()
      .isEmpty(),
    body("profile.affiliateType")
      .exists()
      .isIn(Object.values(AffiliateType)),
    body("profile.locationID")
      .exists()
      .isInt(),
    body("profile.platform")
      .optional({ nullable: true })
      .isIn(Object.values(AffiliatePlatform)),
    body("profile.source")
      .optional({ nullable: true })
      .isIn(Object.values(AffiliateAppSourceType)),
    body("profile.sourceReferralName")
      .optional({ nullable: true })
      .trim()
      .customSanitizer(removeConsecutiveSpaces)
      .not()
      .isEmpty(),
    body("profile.sourceReferralPhoneNumber")
      .optional({ nullable: true })
      .trim()
      .customSanitizer(removeAllSpaces)
      .customSanitizer(formatPhoneNumberToE164)
      .not()
      .isEmpty()
      .custom(isE164PhoneNumber),
    body("profile.deviceData").optional({ nullable: true }),
    body("profile.deviceData.dateAndTime")
      .if(body("profile.deviceData").exists({ checkNull: true }))
      .optional({ nullable: true }),
    body("profile.deviceData.macAddress")
      .if(body("profile.deviceData").exists({ checkNull: true }))
      .exists()
      .customSanitizer(removeAllSpaces)
      .isMACAddress(),
    body("profile.deviceData.ipAddress")
      .if(body("profile.deviceData").exists({ checkNull: true }))
      .exists()
      .customSanitizer(removeAllSpaces)
      .isIP(),
    body("profile.deviceData.osVersion")
      .if(body("profile.deviceData").exists({ checkNull: true }))
      .exists()
      .trim()
      .customSanitizer(removeConsecutiveSpaces)
      .not()
      .isEmpty(),
    body("profile.deviceData.deviceType")
      .if(body("profile.deviceData").exists({ checkNull: true }))
      .exists()
      .trim()
      .customSanitizer(removeConsecutiveSpaces)
      .not()
      .isEmpty(),
    body("credentials.password")
      .exists()
      .not()
      .isEmpty(),
    body("profile.termsAndConditionsVersion")
      .exists()
      .optional({ nullable: true })
      .isString(),
  ]),
  async (request: Request, response: Response): Promise<void> => {
    const services = useServices();

    const requestData = matchedData(request, { includeOptionals: true }) as CreateMeDTO;
    const data = await services.me.create(requestData);

    response.status(201);
    response.json(data);
    response.end();
  },
] as RequestHandler[];
