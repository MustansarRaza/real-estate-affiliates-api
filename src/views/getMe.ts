import { useServices } from "affiliates-api/services";

import { Request, Response } from "express";

export const getMe = async (request: Request, response: Response): Promise<void> => {
  const services = useServices();

  const ssoID = request.kauth.grant.access_token.content.sub;
  const data = await services.me.get({ ssoID });

  response.json(data);
  response.end();
};
