import {
  AGENCY_CONTEXT,
  getAgencyContextFactory,
  getDomainProviders,
  getUserContextFactory,
  USER_CONTEXT,
} from "@pf/domain";
import { AwsS3Client, getGlobalAwsS3Client } from "@pf/integrations";
import { LoggerFactory } from "@pf/utils";
import { Sequelize, sequelize } from "data-access-layer";
import { Request } from "express";
import { Provider, ReflectiveInjector } from "injection-js";

/**
 * This method returns all the providers that need to be resolved
 * @param request Request
 * @returns list of providers
 */
const getProviders = (request: Request): Array<Provider> => {
  const domainProviders: Provider[] = getDomainProviders();
  return [
    ...domainProviders,
    { provide: USER_CONTEXT, useFactory: getUserContextFactory(request) },
    { provide: AGENCY_CONTEXT, useFactory: getAgencyContextFactory(request) },
    { provide: LoggerFactory, useValue: new LoggerFactory(request.log) },
    { provide: AwsS3Client, useValue: getGlobalAwsS3Client() },
    { provide: Sequelize, useValue: sequelize },
  ] as Provider[];
};

/**
 * This method returns the injector after resolving providers from `getProviders`
 * @param request Request
 * @returns ReflectiveInjector
 */
export const createInjector = (request: Request): ReflectiveInjector => {
  const providers: Provider[] = getProviders(request);
  return ReflectiveInjector.resolveAndCreate(providers);
};
