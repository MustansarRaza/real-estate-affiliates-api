declare module "express-routebuilder";
declare module "sequelize-mocking";

declare namespace Express {
  import { Grant } from "keycloak-connect";
  import { ReflectiveInjector } from "injection-js";
  import { Bunyan } from "bunyan";

  export interface Request {
    kauth: {
      grant: Grant;
    };
    injector: ReflectiveInjector;
    log: Bunyan;
  }
}
