import {
  ContractListingCommissionType,
  ContractListingNomineeRelation,
  ContractListingObjectType,
} from "@pf/taxonomies";
import { DataTypes, Model, Sequelize } from "sequelize";

class ContractListing extends Model {
  public id!: number;
  public contractId!: number;
  public objectType!: ContractListingObjectType | null;
  public objectId!: string;
  public paymentPlanId!: number | null;
  public dealPrice!: number | null;
  public dealDiscount!: number | null;
  public commissionType!: ContractListingCommissionType;
  public commissionValue!: number | null;
  public isDeleted!: number | null;
  public expiryDate!: Date | null;
  public nomineeName!: string | null;
  public nomineeEmail!: string | null;
  public nomineeCell!: string | null;
  public nomineeRelation!: ContractListingNomineeRelation | null;
  public addedBy!: number | null;
  public updatedBy!: number | null;
  public createdAt!: Date | null;
  public updatedAt!: Date | null;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "clisting_id",
        },
        contractId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "contract_id",
        },
        objectType: {
          type: DataTypes.ENUM,
          allowNull: true,
          values: Object.values(ContractListingObjectType),
          field: "object_type",
        },
        objectId: {
          type: DataTypes.STRING(50),
          allowNull: false,
          field: "object_id",
        },
        paymentPlanId: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "payment_plan_id",
        },
        dealPrice: {
          type: DataTypes.BIGINT,
          allowNull: true,
          field: "deal_price",
        },
        dealDiscount: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "deal_discount",
        },
        commissionType: {
          type: DataTypes.ENUM,
          values: Object.values(ContractListingCommissionType),
          defaultValue: ContractListingCommissionType.PERCENTAGE,
          field: "commission_type",
        },
        commissionValue: {
          type: DataTypes.FLOAT,
          allowNull: true,
          field: "commission_value",
        },
        isDeleted: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "is_deleted",
        },
        expiryDate: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "expiry_date",
        },
        nomineeName: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: "nominee_name",
        },
        nomineeEmail: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: "nominee_email",
        },
        nomineeCell: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: "nominee_cell",
        },
        nomineeRelation: {
          type: DataTypes.ENUM,
          allowNull: true,
          values: Object.values(ContractListingNomineeRelation),
          field: "nominee_relation",
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
      },
      {
        sequelize,
        tableName: "zn_pf_contracts_listings",
      }
    );
  }
}

export default ContractListing;
