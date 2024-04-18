import { attachUserContext } from "@pf/domain";
import { getGlobalAwsS3Client, setupGlobalAwsS3Client } from "@pf/integrations";
import { createLoggingMiddleware } from "@pf/utils";
import * as Sentry from "@sentry/node";
import apicache from "apicache";
import bodyParser from "body-parser";
import compression from "compression";
import express, { Application } from "express";
import routeBuilder from "express-routebuilder";
import session from "express-session";
import unless from "express-unless";
import helmet from "helmet";
import legacyI18n from "i18n-express";
import Keycloak from "keycloak-connect";
import path from "path";
import redis from "redis";
import { config } from "./config";
import { isCachingEnabled, isSentryEnabled } from "./features";
import logger from "./logger";
import {
  diMiddleware,
  removeDateHeader,
  setDefaultCacheControlHeader,
  setSentryScope,
} from "./middlewares";
import routes from "./routes";

const createExpressApp = (): Application => {
  const app = express();

  if (isSentryEnabled()) {
    app.use(Sentry.Handlers.requestHandler());
  }

  const store = new session.MemoryStore();

  const keycloak = new Keycloak(
    {
      store,
    },
    {
      realm: config.get("keycloak").realm,
      "auth-server-url": config.get("keycloak").authServerURL,
      "ssl-required": "external",
      resource: config.get("keycloak").clientID,
      "bearer-only": true,
      "confidential-port": 443,
    }
  );

  try {
    getGlobalAwsS3Client();
  } catch (error) {
    setupGlobalAwsS3Client(
      {
        bucket: config.get("s3").bucketName,
        bucketRegion: config.get("s3").bucketRegion,
        accessKeyId: config.get("s3").accessKeyID || "",
        secretAccessKey: config.get("s3").secretAccessKey || "",
      },
      logger
    );
  }

  if (config.get("enableCompression")) {
    app.use(compression());
  }

  app.use(helmet());
  app.use(removeDateHeader);
  app.use(setDefaultCacheControlHeader);
  app.use(bodyParser.json());

  const siteLanguages = ["en", "fr"];
  // TODO: remove this middleware
  app.use(
    legacyI18n({
      translationsPath: path.join(__dirname, "/../languages"),
      siteLangs: siteLanguages,
      textsVarName: "translation",
    })
  );

  app.use(
    session({
      // @ts-ignore
      secret: config.get("secret"),
      resave: true,
      saveUninitialized: false,
      store,
    })
  );

  app.use(
    keycloak.middleware({
      logout: "/logout",
      admin: "/",
    })
  );

  if (isSentryEnabled()) {
    app.use(setSentryScope);
  }
  app.use(attachUserContext);

  app.use(createLoggingMiddleware("propforce-affiliates-api", logger));

  app.use(diMiddleware);

  // if redis is enabled/available, cache the response for some endpoints
  // the caching middleware will serve a cache-control header matching
  // the current expiry time
  if (isCachingEnabled()) {
    const redisClient = redis.createClient({
      url: config.get("cache").url!,
      tls: { rejectUnauthorized: false },
    });
    const cache = apicache.options({
      redisClient,
      statusCodes: {
        include: [200],
      },
    });

    logger.info("Enabling Redis-based caching");

    app.use("/categories/:agencyID?", cache.middleware("3 days"));
    app.use("/locations", cache.middleware("8 hours"));
  }

  // protect all endpoints except registration => true for all roles
  const keycloakProtectMiddleware = keycloak.protect(() => true) as unless.RequestHandler;
  keycloakProtectMiddleware.unless = unless;
  app.use(
    keycloakProtectMiddleware.unless({
      path: [
        { url: "/me", method: ["POST"] },
        { url: "/locations", method: ["GET"] },
      ],
      custom: (req) => req.method === "GET" && req.originalUrl.startsWith("/categories"),
    })
  );

  // add all the routes, which are statically declared
  routeBuilder(app, routes);

  if (isSentryEnabled()) {
    app.use(Sentry.Handlers.errorHandler());
  }

  return app;
};

export { createExpressApp };
