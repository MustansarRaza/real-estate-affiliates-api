import convict from "convict";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

convict.addFormat({
  name: "OptionalString",
  validate: (value) => !value || typeof value === "string",
});

const config = convict({
  host: {
    doc: "Hostname/IP the service should bind on.",
    format: "String",
    default: "0.0.0.0",
    env: "HOST",
  },
  port: {
    doc: "Port number for the HTTP server to listen on.",
    format: "port",
    default: 5000,
    env: "PORT",
  },
  secret: {
    doc: "Secret to encrypt cookies with.",
    format: "*",
    default: "test",
    env: "APP_SECRET",
    sensitive: true,
  },
  enableCompression: {
    doc: "Whether to enable GZIP compression of response bodies or not.",
    format: "Boolean",
    default: true,
    env: "APP_ENABLE_COMPRESSION",
  },
  environment: {
    name: {
      doc: "Name of the environment we're running in.",
      format: "String",
      default: "unknown",
      env: "APP_ENVIRONMENT",
    },
    distribution: {
      doc: "Name/description of the build flavour we're running.",
      format: "String",
      default: "default",
      env: "APP_DIST",
    },
    release: {
      doc: "Name/description of the release version we're running.",
      format: "String",
      default: "unknown",
      env: "APP_RELEASE",
    },
  },
  keycloak: {
    realm: {
      doc: "Name of the keycloak realm to use.",
      format: "String",
      default: "propforce",
      env: "KEYCLOAK_REALM",
    },
    clientID: {
      doc: "ID of the client to authenticate with.",
      format: "String",
      default: "affiliates",
      env: "KEYCLOAK_CLIENT_ID",
    },
    clientSecret: {
      doc: "Secret key to authenticate as a client with.",
      format: "String",
      default: null,
      env: "KEYCLOAK_CLIENT_SECRET",
      sensitive: true,
    },
    authServerURL: {
      doc: "URL of the Keycloak server to use (note: ends in /auth).",
      format: "String",
      default: "https://stagemyaccount.propforce.com/auth",
      env: "KEYCLOAK_AUTH_SERVER_URL",
    },
  },
  db: {
    url: {
      doc: "MySQL database connection string",
      format: "String",
      default: "mysql://root:@127.0.0.1:3306/zameen_main",
      env: "DATABASE_URL",
      sensitive: true,
    },
  },
  cache: {
    url: {
      doc: "Redis connection string",
      format: "OptionalString",
      default: null,
      env: "REDIS_URL",
      sensitive: true,
    },
  },
  s3: {
    bucketName: {
      doc: "Name of the AWS S3 bucket to use for images.",
      format: "String",
      default: "affiliates-stage",
      env: "AWS_S3_BUCKET_NAME",
    },
    bucketRegion: {
      doc: "Name of the AWS region the S3 bucket is in.",
      format: "String",
      default: "eu-west-1",
      env: "AWS_S3_BUCKET_REGION",
    },
    accessKeyID: {
      doc: "AWS S3 public access key ID for images.",
      format: "String",
      default: null,
      env: "AWS_S3_ACCESS_KEY_ID",
    },
    secretAccessKey: {
      doc: "AWS S3 secret access key for images.",
      format: "String",
      default: null,
      env: "AWS_S3_SECRET_ACCESS_KEY",
      sensitive: true,
    },
  },
  sentry: {
    dsn: {
      doc: "Sentry's DSN to send events to.",
      format: "OptionalString",
      default: null,
      env: "SENTRY_DSN",
      sensitive: true,
    },
  },
  maxActiveAffiliateReservations: {
    doc: "Number of maximum active reservations for affiliates",
    format: "int",
    default: 2,
    env: "MAX_ACTIVE_AFFILIATE_RESERVATIONS",
  },
  dbTimezone: {
    doc: "Timezone of the database in hours",
    format: "String",
    default: "+05:00",
    env: "DB_TIMEZONE",
  },
});

const loadConfig = (): void => {
  config.validate({ allowed: "strict" });
};

export { config, loadConfig };
