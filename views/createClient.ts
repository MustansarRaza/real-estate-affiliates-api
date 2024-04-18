import { SourcePlatform } from "@pf/taxonomies";
import { isE164PhoneNumber, validate } from "@pf/utils";
import {
  formatPhoneNumberToE164,
  removeAllSpaces,
  removeConsecutiveSpaces,
} from "affiliates-api/sanitization";
import { CreateClientDTO, useServices } from "affiliates-api/services";
import { Request, RequestHandler, Response } from "express";
import { body, matchedData } from "express-validator";

export const createClient = [
  validate([
    body("name")
      .exists()
      .trim()
      .customSanitizer(removeConsecutiveSpaces)
      .not()
      .isEmpty(),
    body("email")
      .exists()
      .trim()
      .not()
      .isEmpty()
      .normalizeEmail({ gmail_remove_dots: false })
      .isEmail(),
    body("phoneNumbers").isArray({ min: 1 }),
    body("phoneNumbers.*.value")
      .trim()
      .customSanitizer(removeAllSpaces)
      .customSanitizer(formatPhoneNumberToE164)
      .not()
      .isEmpty()
      .custom(isE164PhoneNumber),
    body("address")
      .exists()
      .optional({ nullable: true })
      .trim()
      .customSanitizer(removeConsecutiveSpaces)
      .not()
      .isEmpty(),
    body("locationID")
      .exists()
      .optional({ nullable: true })
      .isInt()
      .toInt(),
    body("comment")
      .exists()
      .optional({ nullable: true })
      .trim()
      .customSanitizer(removeConsecutiveSpaces)
      .not()
      .isEmpty(),
    body("source")
      .optional()
      .isIn(Object.values(SourcePlatform)),
  ]),
  async (request: Request, response: Response): Promise<void> => {
    const services = useServices();

    const ssoID = request.kauth.grant.access_token.content.sub;
    const requestData = matchedData(request, { includeOptionals: true }) as CreateClientDTO;
    const data = await services.clients.create({ ssoID }, requestData);

    response.status(201);
    response.json(data);
    response.end();
  },
] as RequestHandler[];
