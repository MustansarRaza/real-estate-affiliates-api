import { useServices } from "affiliates-api/services";

import { Request, Response } from "express";

export const listLeads = async (request: Request, response: Response): Promise<void> => {
  const services = useServices();

  const ssoID = request.kauth.grant.access_token.content.sub;
  const data = await services.leads.list({ ssoID });

  response.json(data);
  response.end();
};
