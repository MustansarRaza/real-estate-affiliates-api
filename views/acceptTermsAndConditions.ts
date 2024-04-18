import { validate } from "@pf/utils";
import { removeAllSpaces } from "affiliates-api/sanitization";
import { useServices } from "affiliates-api/services";
import { Request, RequestHandler, Response } from "express";
import { body, matchedData } from "express-validator";
import { OK } from "http-status-codes";

export const acceptTermsAndConditions = [
  validate([
    body("termsAndConditionsVersion")
      .exists()
      .isString()
      .customSanitizer(removeAllSpaces),
  ]),
  async (request: Request, response: Response): Promise<void> => {
    const services = useServices();

    const ssoID = request.kauth.grant.access_token.content.sub;
    const { termsAndConditionsVersion } = matchedData(request, { includeOptionals: true });

    const data = await services.me.acceptTermsAndConditions(ssoID, termsAndConditionsVersion);
    response.status(OK);
    response.json(data);
    response.end();
  },
] as RequestHandler[];
