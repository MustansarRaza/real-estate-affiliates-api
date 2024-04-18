import { isISO8601Date, validate } from "@pf/utils";
import { useServices } from "affiliates-api/services";
import { ISO8601DateTime } from "affiliates-api/types";
import { Request, RequestHandler, Response } from "express";
import { query } from "express-validator";

export const listLeadsSummary = [
  validate([
    query("fromDate")
      .optional()
      .if(query("fromDate").exists())
      .custom(isISO8601Date),
    query("toDate")
      .optional()
      .if(query("toDate").exists())
      .custom(isISO8601Date),
  ]),
  async (request: Request, response: Response): Promise<void> => {
    const services = useServices();

    const ssoID = request.kauth.grant.access_token.content.sub;

    const dateRange = {
      fromDate: request.query.fromDate as ISO8601DateTime | undefined,
      toDate: request.query.toDate as ISO8601DateTime | undefined,
    };

    const data = await services.leads.listSummary({ ssoID }, dateRange);

    response.json(data);
    response.end();
  },
] as RequestHandler[];
