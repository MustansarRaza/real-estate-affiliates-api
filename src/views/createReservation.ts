import { Request, RequestHandler, Response } from "express";
import { validate } from "@pf/utils";
import { body, matchedData } from "express-validator";
import { useServices } from "affiliates-api/services";
import { removeConsecutiveSpaces } from "affiliates-api/sanitization";
import { CreateReservationDTO } from "affiliates-api/services";
import { ListingReservationSource } from "@pf/taxonomies";
export const createReservation = [
  validate([
    body("leadID")
      .exists()
      .isInt()
      .toInt(),
    body("listingID")
      .exists()
      .isInt()
      .toInt(),
    body("comments")
      .exists()
      .optional({ nullable: true })
      .trim()
      .customSanitizer(removeConsecutiveSpaces)
      .not()
      .isEmpty(),
    body("source")
      .optional()
      .isIn(Object.values(ListingReservationSource)),
  ]),
  async (request: Request, response: Response): Promise<void> => {
    const services = useServices();

    const ssoID = request.kauth.grant.access_token.content.sub;
    const reservation = await services.reservations.create(
      { ssoID },
      matchedData(request, { includeOptionals: true }) as CreateReservationDTO
    );
    response.status(201);
    response.json(reservation);
    response.end();
  },
] as RequestHandler[];
