import { useServices } from "affiliates-api/services";

import { Request, Response } from "express";

export const listLocations = async (_: Request, response: Response): Promise<void> => {
  const services = useServices();

  const data = await services.locations.list();

  response.json(data);
  response.end();
};
