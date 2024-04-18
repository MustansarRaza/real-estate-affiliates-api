import { validate } from "@pf/utils";
import { TaskAgainstType } from "affiliates-api/models";
import { commaSeparatedStringToArray, removeAllSpaces } from "affiliates-api/sanitization";
import { useServices } from "affiliates-api/services";
import { Request, RequestHandler, Response } from "express";
import { query } from "express-validator";

export const listTasks = [
  validate([
    query("againstType")
      .optional()
      .trim()
      .customSanitizer(removeAllSpaces)
      .not()
      .isEmpty()
      .customSanitizer(commaSeparatedStringToArray)
      .isArray(),
    query("againstType.*").isIn(Object.values(TaskAgainstType)),
  ]),
  async (request: Request, response: Response): Promise<void> => {
    const services = useServices();

    const ssoID = request.kauth.grant.access_token.content.sub;
    const againstTypes = request.query.againstType as TaskAgainstType[] | undefined;
    const data = await services.tasks.list({ ssoID, againstTypes });

    response.json(data);
    response.end();
  },
] as RequestHandler[];
