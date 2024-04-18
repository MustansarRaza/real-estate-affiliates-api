import { validate } from "@pf/utils";
import { useServices } from "affiliates-api/services";
import { Request, RequestHandler, Response } from "express";
import { param } from "express-validator";

export const listCategories = [
  validate([
    param("agencyID")
      .optional()
      .isInt()
      .toInt(),
  ]),
  async (request: Request, response: Response): Promise<void> => {
    const services = useServices();

    const agencyID = parseInt(request.params.agencyID, 10) || null;

    const data = await services.categories.list(agencyID);

    response.json(data);
    response.end();
  },
] as RequestHandler[];
