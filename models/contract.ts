import { ContractObjectType, ContractSourceObjectTypes } from "@pf/taxonomies";
import { DataTypes, Model, Sequelize } from "sequelize";

class Contract extends Model {
  public id!: number;
  public ownerObjectType!: ContractObjectType | null;
  public ownerObjectId!: number;
  public sourceObjectType!: ContractSourceObjectTypes | null;
  public sourceObjectId!: number | null;
  public status!: number | null;
  public stage!: number | null;
  public contractDate!: Date | null;
  public signedDate!: Date | null;
  public closedBy!: number | null;
  public addedBy!: number | null;
  public updatedBy!: number | null;
  public createdAt!: Date | null;
  public updatedAt!: Date | null;
  public externalSystemId!: string | null;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "contract_id",
        },
        ownerObjectType: {
          type: DataTypes.ENUM,
          allowNull: true,
          values: Object.values(ContractObjectType),
          field: "owner_object_type",
        },
        ownerObjectId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "owner_object_id",
        },
        sourceObjectType: {
          type: DataTypes.ENUM,
          allowNull: true,
          values: Object.values(ContractSourceObjectTypes),
          field: "source_object_type",
        },
        sourceObjectId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "source_object_id",
        },
        status: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        stage: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        contractDate: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "contract_date",
        },
        signedDate: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "signed_date",
        },
        closedBy: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "closed_by",
        },
        addedBy: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "added_by",
        },
        updatedBy: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "updated_by",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "date_added",
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "date_updated",
        },
        externalSystemId: {
          type: DataTypes.STRING,
          allowNull: true,
          field: "external_system_id",
        },
      },
      {
        sequelize,
        tableName: "zn_pf_contracts",
      }
    );
  }
}

export default Contract;
