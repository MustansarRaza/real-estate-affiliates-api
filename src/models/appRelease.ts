import { DataTypes, Model, Sequelize } from "sequelize";

export type AppVariables = {
  min_version: string;
};

class AppRelease extends Model {
  public id!: number;
  public appName!: string;
  public version!: string;
  public fileUrl!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  public appVariables!: AppVariables | null;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "aa_id",
        },
        appName: {
          type: DataTypes.STRING(255),
          allowNull: false,
          field: "app_name",
        },
        version: {
          type: DataTypes.STRING(128),
          allowNull: false,
        },
        fileUrl: {
          type: DataTypes.STRING(128),
          allowNull: true,
          unique: true,
          field: "file_url",
        },
        createdAt: {
          type: DataTypes.DATE,
          field: "date_added",
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          field: "date_updated",
          allowNull: false,
        },
        appVariables: {
          type: DataTypes.JSON,
          allowNull: true,
          field: "app_variables",
        },
      },
      {
        sequelize,
        tableName: "zn_app_releases",
      }
    );
  }
}

export default AppRelease;
