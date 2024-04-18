import { Sequelize, Model, DataTypes } from "sequelize";

class ProjectImage extends Model {
  public id!: number;
  public projectID!: number;

  public title!: string | null;

  public baseURL!: string | null;
  public path!: string | null;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        projectID: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "project_id",
        },
        title: {
          type: new DataTypes.STRING(255),
          allowNull: false,
        },
        baseURL: {
          type: new DataTypes.STRING(255),
          allowNull: true,
          field: "base_url",
        },
        path: {
          type: new DataTypes.STRING(255),
          allowNull: true,
          field: "file_path",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "created_at",
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "updated_at",
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "deleted_at",
        },
      },
      {
        sequelize,
        tableName: "zn_cpml_project_image",
      }
    );
  }
}

export default ProjectImage;
