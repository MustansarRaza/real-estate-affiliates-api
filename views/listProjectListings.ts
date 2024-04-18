import { validate } from "@pf/utils";
import { ListingAgainstType } from "affiliates-api/models";
import { useServices } from "affiliates-api/services";

import { Request, Response, RequestHandler } from "express";
import { param, query, matchedData } from "express-validator";
import { commaSeparatedStringToIntArray, removeAllSpaces } from "affiliates-api/sanitization";

export const listProjectListings = [
  validate([
    param("projectID")
      .exists()
      .isInt()
      .toInt(),
    query("categoryIDs")
      .optional()
      .trim()
      .customSanitizer(removeAllSpaces)
      .not()
      .isEmpty()
      .customSanitizer(commaSeparatedStringToIntArray)
      .isArray(),
    query("minPrice")
      .optional()
      .isInt()
      .toInt(),
    query("maxPrice")
      .optional()
      .isInt()
      .toInt(),
    query("minArea")
      .optional()
      .isInt()
      .toInt(),
    query("maxArea")
      .optional()
      .isInt()
      .toInt(),
  ]),
  async (request: Request, response: Response): Promise<void> => {
    const services = useServices();

    const ssoID = request.kauth.grant.access_token.content.sub;
    const owner = await services.me.owner({ ssoID });

    if (!owner) {
      return response.json([]).end();
    }

    const projectID = (request.params.projectID as unknown) as number;

    const data = await services.listings.list({
      agencyID: owner.agencyID,
      againstType: ListingAgainstType.PROJECT,
      againstID: projectID,
      ...matchedData(request, { includeOptionals: true }),
    });

    response.json(data);
    response.end();
  },
] as RequestHandler[];
