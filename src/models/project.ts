import { DataTypes, Model, Sequelize } from "sequelize";
import ProjectImage from "./projectImage";

export enum ProjectStatus {
  ON = "on",
  OFF = "off",
}

export enum ProjectAffiliateVisibilityID {
  INVISIBLE = 0,
  VISIBLE = 1,
}

class Project extends Model {
  public id!: number;
  public externalID!: number;
  public slug!: string;
  public status!: ProjectStatus;
  public name!: string;
  public description!: string | null;
  public address!: string | null;
  public addressID!: string | null;
  public agencyID!: number | null;
  public locationID!: number | null;
  public url!: string | null;

  public commissionPercentage!: number | null;
  public affiliateVisibiltiy!: ProjectAffiliateVisibilityID;

  public createdAt!: Date;
  public updatedAt!: Date;

  public ProjectImages!: ProjectImage[];

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "project_id",
        },
        externalID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "external_id",
        },
        slug: {
          type: new DataTypes.STRING(255),
          allowNull: false,
          field: "project_key",
        },
        status: {
          type: DataTypes.ENUM,
          allowNull: false,
          values: Object.values(ProjectStatus),
          field: "project_status",
        },
        name: {
          type: new DataTypes.STRING(100),
          allowNull: false,
          field: "project_name",
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        addressID: {
          type: DataTypes.INTEGER,
          field: "address_id",
        },
        agencyID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "agent_id",
        },
        locationID: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "location_id",
        },
        url: {
          type: new DataTypes.STRING(255),
          allowNull: true,
        },
        commissionPercentage: {
          type: DataTypes.FLOAT,
          allowNull: true,
          field: "commission",
        },
        affiliateVisibility: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "affiliate_visibility",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "date_added",
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "date_updated",
        },
      },
      {
        sequelize,
        tableName: "zn_cpml_projects",
      }
    );
  }
}

export default Project;
