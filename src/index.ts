import { createExpressApp } from "./app";
import { config, loadConfig } from "./config";
import logger from "./logger";
import { sequelize } from "./models";
import * as Sentry from "@sentry/node";
import { RewriteFrames } from "@sentry/integrations";
import { isSentryEnabled } from "./features";

(async (): Promise<void> => {
  loadConfig();

  logger.info(
    {
      environment: config.get("environment").name,
      release: config.get("environment").release,
    },
    "Starting up"
  );

  if (isSentryEnabled()) {
    Sentry.init({
      dsn: config.get("sentry").dsn!,
      environment: config.get("environment").name,
      dist: config.get("environment").distribution,
      release: config.get("environment").release,
      integrations: [
        new RewriteFrames({
          root: __dirname,
        }),
      ],
    });

    logger.info("Sentry integration enabled");
  }

  await sequelize.authenticate();

  const app = createExpressApp();

  app.listen(config.get("port"), config.get("host"), () => {
    logger.info(
      {
        host: config.get("host"),
        port: config.get("port"),
      },
      "Started listening"
    );
  });
})();
