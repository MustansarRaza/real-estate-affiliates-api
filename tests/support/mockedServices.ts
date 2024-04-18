import {
  CommissionsService,
  ListingsService,
  LocationsService,
  MeService,
  ProfileService,
  TaskTypesService,
} from "affiliates-api/services";
import jestMock from "jest-mock";

/**
 * Analyzes the specified class constructor and generates a mocked
 * instance where every function and property is a `jest.Mock`.
 */
function createMockInstance<T>(classConstructor: Function): jest.Mocked<T> {
  const metaData = jestMock.getMetadata(classConstructor);
  if (!metaData) {
    throw new Error("Cannot get meta data for class");
  }

  const Mock = jestMock.generateFromMetadata(metaData);
  return (new Mock() as unknown) as jest.Mocked<T>;
}

interface MockedServices {
  me: jest.Mocked<MeService>;
  profile: jest.Mocked<ProfileService>;
  locations: jest.Mocked<LocationsService>;
  listings: jest.Mocked<ListingsService>;
  commissions: jest.Mocked<CommissionsService>;
  taskTypes: jest.Mocked<TaskTypesService>;
}

export const useMockedServices = (): MockedServices => ({
  me: createMockInstance(MeService),
  profile: createMockInstance(ProfileService),
  locations: createMockInstance(LocationsService),
  listings: createMockInstance(ListingsService),
  commissions: createMockInstance(CommissionsService),
  taskTypes: createMockInstance(TaskTypesService),
});
