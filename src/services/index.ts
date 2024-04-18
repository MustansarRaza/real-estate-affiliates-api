import AppRelease from "./AppRelease";
import CategoriesService from "./categories";
import ClientsService, { CreateClientDTO as CreateClientDTOType } from "./clients";
import CommissionsService from "./commissions";
import LeadsService, { CreateLeadDTO as CreateLeadDTOType } from "./leads";
import ListingsService, { ListingDTO as ListingDTOType } from "./listings";
import LocationsService from "./locations";
import MeService, { CreateMeDTO as CreateMeDTOType, MeDTO as MeDTOType } from "./me";
import ProfileService from "./profile";
import ProjectsService from "./projects";
import ListingReservationService, { ListingReservationOptions } from "./reservations";
import TasksService from "./tasks";
import TaskTypesService from "./taskTypes";

export interface ServiceMesh {
  profile: ProfileService;
  me: MeService;
  clients: ClientsService;
  tasks: TasksService;
  taskTypes: TaskTypesService;
  leads: LeadsService;
  projects: ProjectsService;
  listings: ListingsService;
  locations: LocationsService;
  categories: CategoriesService;
  reservations: ListingReservationService;
  commissions: CommissionsService;
  appRelease: AppRelease;
}

const useServices = (): ServiceMesh => {
  const locations = new LocationsService();
  const profile = new ProfileService({ locations });
  const me = new MeService({ profile, locations });
  const clients = new ClientsService({ me, locations });
  const taskTypes = new TaskTypesService();
  const leads = new LeadsService({ me, taskTypes });
  const tasks = new TasksService({ leads, taskTypes });
  const listings = new ListingsService({ me });
  const commissions = new CommissionsService();
  const projects = new ProjectsService({ me, listings, commissions, locations });
  const categories = new CategoriesService();
  const reservations = new ListingReservationService({ me, listings });
  const appRelease = new AppRelease();

  return {
    profile,
    me,
    clients,
    leads,
    tasks,
    taskTypes,
    projects,
    listings,
    locations,
    categories,
    reservations,
    commissions,
    appRelease,
  };
};

export {
  useServices,
  ClientsService,
  LeadsService,
  MeService,
  ProfileService,
  ProjectsService,
  ListingsService,
  TasksService,
  TaskTypesService,
  LocationsService,
  CategoriesService,
  ListingReservationService,
  CommissionsService,
  AppRelease,
};

export type CreateClientDTO = CreateClientDTOType;
export type CreateLeadDTO = CreateLeadDTOType;
export type CreateMeDTO = CreateMeDTOType;
export type CreateReservationDTO = ListingReservationOptions;
export type ListingDTO = ListingDTOType;
export type MeDTO = MeDTOType;
