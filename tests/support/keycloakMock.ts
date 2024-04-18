import { config } from "affiliates-api/config";
import * as KeycloakMock from "keycloak-mock";

const initializeKeycloakMock = async (): Promise<KeycloakMock.Mock> => {
  const keycloak = await KeycloakMock.createMockInstance({
    authServerURL: config.get("keycloak").authServerURL,
    realm: config.get("keycloak").realm,
    clientID: config.get("keycloak").clientID,
    clientSecret: config.get("keycloak").clientSecret,
    keySize: 512,
  });

  return KeycloakMock.activateMock(keycloak);
};

const useKeycloakMock = (): KeycloakMock.MockInstance => {
  return KeycloakMock.getMockInstance(config.get("keycloak").authServerURL);
};

const resetKeycloakMock = (): void => {
  const kmock = useKeycloakMock();
  kmock.database.clear();
};

export { initializeKeycloakMock, useKeycloakMock, resetKeycloakMock };
