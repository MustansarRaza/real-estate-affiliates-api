import { asyncHandler } from "@pf/utils";
import { checkBlockedAffiliate } from "./middlewares";
import {
  acceptTermsAndConditions,
  createClient,
  createLead,
  createMe,
  createReservation,
  getAppRelease,
  getMe,
  getProfile,
  listCategories,
  listClients,
  listLeads,
  listLeadsSummary,
  listLocations,
  listProjectListings,
  listProjects,
  listReservations,
  listSecondaryListings,
  listTasks,
} from "./views";

const routes = {
  get: {
    "/me": asyncHandler([checkBlockedAffiliate, getMe]),
    "/profile": asyncHandler(getProfile),
    "/clients": asyncHandler(listClients),
    "/leads": asyncHandler(listLeads),
    "/leads/summary": asyncHandler(listLeadsSummary),
    "/tasks": asyncHandler(listTasks),
    "/locations": asyncHandler(listLocations),
    "/categories/:agencyID?": asyncHandler(listCategories),
    "/markets/primary/projects": asyncHandler(listProjects),
    "/markets/primary/projects/:projectID/listings": asyncHandler(listProjectListings),
    "/markets/secondary/listings/": asyncHandler(listSecondaryListings),
    "/reservations": asyncHandler(listReservations),
    "/appRelease": asyncHandler(getAppRelease),
  },
  post: {
    "/me": asyncHandler(createMe),
    "/clients": [asyncHandler(checkBlockedAffiliate), asyncHandler(createClient)],
    "/leads": [asyncHandler(checkBlockedAffiliate), asyncHandler(createLead)],
    "/reservations": [asyncHandler(checkBlockedAffiliate), asyncHandler(createReservation)],
    "/acceptTermsAndConditions": asyncHandler(acceptTermsAndConditions),
  },
};

export default routes;
