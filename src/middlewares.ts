import { Request, Response, NextFunction } from "express";
import { UNAUTHORIZED } from "http-status-codes";
import * as Sentry from "@sentry/node";
import { createInjector } from "./di";
import {
  PotentialAffiliate,
  AffiliateContact,
  Affiliate,
  AffiliateStatus,
  AffiliateStatusKey,
} from "affiliates-api/models";
import { Op } from "sequelize";
import { get } from "lodash";
import { AppError } from "@pf/utils";

/**
 * Removes the 'Date' header from the response.
 *
 * Clients do not have to be aware of how stale/fresh the data is.
 * They can make the assumption that the server serves data that
 * is not stale.
 */
export const removeDateHeader = (
  _request: Request,
  response: Response,
  next: NextFunction
): void => {
  response.removeHeader("date");
  next();
};

/**
 * Override the default express "Cache-Control" header and
 * set it so that clients don't cache data.
 *
 * When the caching middleware is enabled, this is overriden
 * for endpoints that having caching enabled.
 */
export const setDefaultCacheControlHeader = (
  _request: Request,
  response: Response,
  next: NextFunction
): void => {
  // the 'private' directive tells clients that the response is
  // private/specific to the current client and cannot be cached
  // and cannot be shared to quickly serve the response to multiple
  // concurrent clients
  //
  // the 'no-store' directive informs clients that the response
  // may not be stored for caching
  //
  // see: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
  response.setHeader("Cache-Control", "private, no-store");
  next();
};

/**
 * Creates a Sentry scope for the current request and sets
 * additional data about the request on the scope.
 *
 * If the user is authenticated, the user's ID, username
 * and email is sent to Sentry.
 */
export const setSentryScope = (request: Request, _response: Response, next: NextFunction): void => {
  Sentry.configureScope(function(scope) {
    const { grant } = request.kauth;

    if (grant?.access_token?.content) {
      const { sub: id, name } = grant.access_token.content;
      scope.setUser({ id, username: name });
    } else {
      scope.setUser(null);
    }

    next();
  });
};

/**
 *
 * This middleware resolves the providers and then injects
 * the dependencies into `@injectable` Classes/Services.
 * Injects injectable Classes/Services into Request.injector
 * enables it to be accessed in any `RouteHanlder`.
 *
 * @param request Request
 * @param _response Response
 * @param next NextFunction
 * @returns void
 *
 */
export const diMiddleware = (request: Request, _response: Response, next: NextFunction): void => {
  request.injector = createInjector(request);
  next();
};

/**
 * Affiliate is considered as blocked if MOU gets rejected.
 * The middleware protects endpoint from being accessed by
 * blocked affiliates.
 */
export const checkBlockedAffiliate = async (
  request: Request,
  _response: Response,
  next: NextFunction
): Promise<void> => {
  const ssoID = request.kauth.grant.access_token.content.sub;
  const potentialAffiliate = await PotentialAffiliate.findOne({
    attributes: ["id"],
    where: {
      ssoID: {
        [Op.eq]: ssoID,
      },
    },
    include: [
      {
        model: AffiliateContact,
        required: false,
        attributes: ["affiliateID"],
        include: [
          {
            model: Affiliate,
            required: true,
            attributes: ["id"],
            include: [
              {
                model: AffiliateStatus,
                required: false,
                attributes: ["id", "key"],
              },
            ],
          },
        ],
      },
    ],
  });

  if (
    get(potentialAffiliate, "AffiliateContact.Affiliate.AffiliateStatus.key", null) ===
    AffiliateStatusKey.REJECTED
  ) {
    const AFFILIATE_MOU_REJECTED = "Affiliate MOU Rejected";
    throw new AppError("Affiliate blocked due to rejected MOU", {
      name: AFFILIATE_MOU_REJECTED,
      statusCode: UNAUTHORIZED,
    });
  } else next();
};
