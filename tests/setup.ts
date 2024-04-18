import { AppErrorSnapshotSerializer, PresignedS3URLSnapshotSerializer } from "@pf/test-utils";
import { config } from "affiliates-api/config";

import {
  initializeKeycloakMock,
  resetKeycloakMock,
  activateSequelizeMock,
  deactivateSequelizeMock,
} from "./support";

const resetConfigVars = (): void => {
  config.set("secret", config.default("secret"));
  config.set("keycloak.authServerURL", "http://localhost/auth");
  config.set("keycloak.clientSecret", "secret");
  config.set("db.url", "mysql://root:@127.0.0.1:3306/zameen_main");
  config.set("s3.bucketName", "s3bucket");
  config.set("s3.bucketRegion", "eu-west-1");
  config.set("s3.accessKeyID", "S3ACCESSKEYID");
  config.set("s3.secretAccessKey", "S3SECRETACCESSKEY");
};

beforeAll(async () => {
  resetConfigVars();

  await initializeKeycloakMock();
});

beforeEach(async () => {
  resetConfigVars();
  resetKeycloakMock();

  await activateSequelizeMock();
});

afterEach(async () => {
  await deactivateSequelizeMock();
});

jest.setTimeout(50000);
jest.mock("request-promise-native");

expect.addSnapshotSerializer(AppErrorSnapshotSerializer);
expect.addSnapshotSerializer(PresignedS3URLSnapshotSerializer);
