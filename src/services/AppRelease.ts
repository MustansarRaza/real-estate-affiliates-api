import { AppRelease } from "affiliates-api/models";
import { Op } from "sequelize";

export interface AppVariablesDTO {
  min_version: string;
}
export interface SettingsDTO {
  version: string;
  appVariables: AppVariablesDTO;
}
class AppReleaseService {
  /**
   * Returns mobile application settings
   */
  async get(appName: string): Promise<SettingsDTO | null> {
    const release = await AppRelease.findOne({
      attributes: ["version", "appVariables"],
      where: {
        appName: {
          [Op.eq]: appName,
        },
      },
    });

    return release ? this.serialize(release) : null;
  }
  /**
   * Serializes a queried {@see AppRelease} model instance into a DTO.
   */
  private serialize(release: AppRelease): SettingsDTO {
    return {
      version: release.version.toString(),
      appVariables: {
        min_version: release.appVariables!.min_version,
      },
    };
  }
}
export default AppReleaseService;
