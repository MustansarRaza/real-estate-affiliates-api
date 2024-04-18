import { createExpressApp } from "affiliates-api/app";
import { Application } from "express";
import * as KeycloakMock from "keycloak-mock";
import supertest from "supertest";

import { ModelFixtureConstants } from "./data";
import { useKeycloakMock } from "./keycloakMock";

/**
 * Thin wrapper over `supertest` that makes it easy to
 * use one of the pre-defined users in different states
 * to make authenticated requests.
 */
class RequestFactory {
  app: Application;
  kmock: KeycloakMock.MockInstance;

  _user: KeycloakMock.MockUser | null;

  constructor(app: Application, kmock: KeycloakMock.MockInstance) {
    this.app = app;
    this.kmock = kmock;

    this._user = null;
  }

  /**
   * Gets the user currently used for request.
   */
  user(): KeycloakMock.MockUserProfile | null {
    return this._user?.profile || null;
  }

  /**
   * Make subsequent requests with the specified user.
   */
  withUser(user: KeycloakMock.MockUser): this {
    this._user = user;
    return this;
  }

  /**
   * Creates a new user and uses it for all subsequent requests.
   */
  createUser(options?: KeycloakMock.CreateMockUserOptions): this {
    return this.withUser(this.kmock.database.createUser(options));
  }

  /**
   * Make all subsequent requests with a verified user.
   */
  withVerifiedUser(): this {
    return this.withUser(this.createOrGetUserWithID(ModelFixtureConstants.verifiedSSOID));
  }

  /**
   * Make all subsequent requests with an unverified user.
   */
  withUnverifiedUser(): this {
    return this.withUser(this.createOrGetUserWithID(ModelFixtureConstants.unverifiedSSOID));
  }

  /**
   * Make all subsequent requests with a non-Existant user.
   */
  withNonExistantUser(): this {
    return this.withUser(this.createOrGetUserWithID(ModelFixtureConstants.nonExistantSSOID));
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  get(path: string) {
    const request = supertest(this.app).get(path);

    if (this._user) {
      const token = this.kmock.createBearerToken(this._user.profile.id);

      return request.set("Authorization", `Bearer ${token}`);
    }

    return request;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  post(path: string) {
    const request = supertest(this.app).post(path);

    if (this._user) {
      const token = this.kmock.createBearerToken(this._user.profile.id);

      return request.set("Authorization", `Bearer ${token}`);
    }

    return request;
  }

  /**
   * Creates a new user with the specified ID or returns
   * the existing user with the same ID.
   */
  private createOrGetUserWithID(ssoID: string): KeycloakMock.MockUser {
    const user = this.kmock.database.findUserByID(ssoID);
    if (user) {
      return user;
    }

    return this.kmock.database.createUser({ id: ssoID });
  }
}

/**
 * Use the {@see RequestFactory} which assists in making
 * authenticated requests.
 */
export const useRequestFactory = (): RequestFactory => {
  const app = createExpressApp();
  const kmock = useKeycloakMock();

  return new RequestFactory(app, kmock);
};
