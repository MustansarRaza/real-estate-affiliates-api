import { Request, Response } from "express";
import { useServices } from "affiliates-api/services";

export const listReservations = async (request: Request, response: Response): Promise<void> => {
  const services = useServices();

  const ssoID = request.kauth.grant.access_token.content.sub;
  const data = await services.reservations.list({ ssoID });

  response.json(data);
  response.end();
};
