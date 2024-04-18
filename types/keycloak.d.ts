declare module "keycloak-connect" {
  import { RequestHandler, Request, Response } from "express";

  export interface Config {
    store: any;
  }

  export interface MiddlewareOptions {
    logout?: string;
    admin?: string;
  }

  export interface TokenContent {
    sub: string;
    exp: number;
  }

  export interface Token {
    token: string;
    content: TokenContent;
  }

  export interface UserInfo {
    sub: string;
    email: string;
    email_verified: boolean;
    gender: "male" | "female";
    name: string;
    preferred_username: string;
    given_name: string;
    family_name: string;
  }

  export class GrantManager {
    async userInfo(token: string | Token): Promise<UserInfo>;
  }

  export type SpecHandler = (token: Token, request: Request, response: Response) => boolean;

  export default class {
    grantManager: GrantManager;

    constructor(config: Config, keycloakConfig?: {} | string);

    middleware(options: MiddlewareOptions): RequestHandler;
    protect(spec?: string | SpecHandler): RequestHandler;
  }
}
