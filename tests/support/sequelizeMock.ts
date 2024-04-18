import path from "path";

import { sequelize } from "affiliates-api/models";
import { Sequelize } from "sequelize";

import SequelizeMock from "sequelize-mocking/lib/sequelize-mocking";

import { ModelFixtureNames } from "./data";

let mockInstance: Sequelize | null = null;
// @ts-ignore
const originalTimezone = sequelize.options.timezone;
const mockOptions = { logging: false };

/**
 * Activiate the sequelize mock by creating an empty SQLite database.
 */
const activateSequelizeMock = async (): Promise<void> => {
  // @ts-ignore
  delete sequelize.options.timezone;
  mockInstance = await SequelizeMock.create(sequelize, mockOptions);
};

/**
 * De-activate the sequelize mock.
 */
const deactivateSequelizeMock = async (): Promise<void> => {
  if (!mockInstance) {
    return;
  }
  // @ts-ignore
  sequelize.options.timezone = originalTimezone;
  await SequelizeMock.restore(mockInstance, mockOptions);
};

/**
 * Loads JSON fixture files with data into the temporary
 * test/mock database.
 *
 * Fixtures are loaded sequentially and in the order in
 * which they are specified.
 */
const loadSequelizeFixtures = async (...names: ModelFixtureNames[]): Promise<void> => {
  for (let i = 0; i < names.length; i++) {
    await SequelizeMock.loadFixtureFile(
      mockInstance,
      // eslint-disable-next-line security/detect-object-injection
      path.resolve(path.join(__dirname, `fixtures/${names[i]}.json`)),
      mockOptions
    );
  }
};

export { activateSequelizeMock, deactivateSequelizeMock, loadSequelizeFixtures };
