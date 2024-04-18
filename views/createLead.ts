import { SourcePlatform } from "@pf/taxonomies";
import { validate } from "@pf/utils";
import {
  LeadClassification,
  LeadInquiryBudgetCurrency,
  LeadInquiryObjectType,
  LeadMarket,
  LeadSide,
  Purpose,
} from "affiliates-api/models";
import { CreateLeadDTO, useServices } from "affiliates-api/services";
import { Request, RequestHandler, Response } from "express";
import { body, matchedData } from "express-validator";
import { LeadsService } from "@pf/domain";

export const createLead = [
  validate([
    body("clientID")
      .exists()
      .isInt()
      .toInt(),
    body("side")
      .exists()
      .isIn(Object.values(LeadSide)),
    body("market")
      .exists()
      .isIn(Object.values(LeadMarket)),
    body("classification")
      .exists()
      .optional({ nullable: true })
      .isIn(Object.values(LeadClassification)),
    body("inquiry.object")
      .exists()
      .optional({ nullable: true }),
    body("inquiry.object.type")
      .if(body("inquiry.object").exists({ checkNull: true }))
      .exists()
      .isIn(Object.values(LeadInquiryObjectType)),
    body("inquiry.object.id")
      .if(body("inquiry.object").exists({ checkNull: true }))
      .exists()
      .isInt()
      .toInt(),
    body("inquiry.purpose")
      .exists()
      .optional({ nullable: true })
      .isIn(Object.values(Purpose)),
    body("inquiry.categoryID")
      .exists()
      .optional({ nullable: true })
      .isInt(),
    body("inquiry.locationIDs")
      .exists()
      .isArray(),
    body("inquiry.locationIDs.*")
      .isInt()
      .toInt(),
    body("inquiry.budget")
      .exists()
      .optional({ nullable: true }),
    body("inquiry.budget.currency")
      .if(body("inquiry.budget").exists({ checkNull: true, checkFalsy: true }))
      .exists()
      .isIn(Object.values(LeadInquiryBudgetCurrency)),
    body("inquiry.budget.amount")
      .if(body("inquiry.budget").exists({ checkNull: true, checkFalsy: true }))
      .exists()
      .isDecimal(),
    body("inquiry.bedroomCount")
      .exists()
      .optional({ nullable: true })
      // buckingham palace has 775 bedrooms, ain't
      // no place with more bedrooms
      .isInt({ min: 0, max: 775 })
      .toInt(),
    body("inquiry.bathroomCount")
      .exists()
      .optional({ nullable: true })
      // buckingham palace has 75 bathrooms, ain't
      // no place with more bathrooms
      .isInt({ min: 0, max: 80 })
      .toInt(),
    body("inquiry.unitNumber")
      .optional({ nullable: true })
      .isString(),
    body("source")
      .optional()
      .isIn(Object.values(SourcePlatform)),
  ]),
  async (request: Request, response: Response): Promise<void> => {
    const services = useServices();
    const leadsService = request.injector.get(LeadsService);
    const ssoID = request.kauth.grant.access_token.content.sub;
    const requestData = matchedData(request, { includeOptionals: true }) as CreateLeadDTO;
    const data = await services.leads.create(
      { ssoID },
      requestData,
      leadsService,
      request.app.locals.translation
    );

    response.status(201);
    response.json(data);
    response.end();
  },
] as RequestHandler[];
