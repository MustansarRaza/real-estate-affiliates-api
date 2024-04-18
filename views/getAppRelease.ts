import { useServices } from "affiliates-api/services";
import { Request, Response } from "express";

const AFFILIATES_MOBILE_APP = "Affiliates Mobile App";
export const getAppRelease = async (_request: Request, response: Response): Promise<void> => {
  const services = useServices();

  const data = await services.appRelease.get(AFFILIATES_MOBILE_APP);
  response.json(data);
  response.end();
};
