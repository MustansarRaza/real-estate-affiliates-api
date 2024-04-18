import { ListingAgainstType } from "affiliates-api/models";
import { useServices } from "affiliates-api/services";

import { Request, Response } from "express";

export const listSecondaryListings = async (
  request: Request,
  response: Response
): Promise<void> => {
  const services = useServices();

  const ssoID = request.kauth.grant.access_token.content.sub;
  const owner = await services.me.owner({ ssoID });

  if (!owner) {
    return response.json([]).end();
  }

  const data = await services.listings.list({
    agencyID: owner.agencyID,
    againstType: ListingAgainstType.LEAD,
  });

  response.json(data);
  response.end();
};
