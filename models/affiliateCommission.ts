import { AffiliateCommissionInventoryType, AffiliateCommissionType } from "@pf/taxonomies";
import { DataTypes, Model, Sequelize } from "sequelize";

class AffiliateCommission extends Model {
  public id!: number;
  public projectId!: number;
  public affiliateTypeId!: number;
  public propertyTypeId!: number;
  public inventoryType!: AffiliateCommissionInventoryType | null;
  public inventorySizeFrom!: string | number | null;
  public inventorySizeTo!: string | number | null;
  public startDate!: Date | null;
  public endDate!: Date | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  public createdBy!: Date;
  public commissionType!: AffiliateCommissionType;
  public downPayment!: number;
  public sellingPrice!: number | null;
  public soldUnitsMin!: number | null;
  public soldUnitsMax!: number | null;
  public commission!: number;
  public classifiedCredits!: number | null;
  public additionalCommission!: number | null;
  public totalCommission!: number | null;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        projectId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "project_id",
        },
        affiliateTypeId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "affiliate_type_id",
        },
        propertyTypeId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "property_type_id",
        },
        inventoryType: {
          type: DataTypes.ENUM,
          values: Object.values(AffiliateCommissionInventoryType),
          allowNull: true,
          defaultValue: null,
          field: "inventory_type",
        },
        inventorySizeFrom: {
          type: DataTypes.STRING(64),
          allowNull: true,
          field: "inventory_size_from",
        },
        inventorySizeTo: {
          type: DataTypes.STRING(64),
          allowNull: true,
          field: "inventory_size_to",
        },
        startDate: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "start_date",
        },
        endDate: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "end_date",
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
        createdBy: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "created_by",
        },
        commissionType: {
          type: DataTypes.ENUM,
          values: Object.values(AffiliateCommissionType),
          allowNull: false,
          field: "commission_type",
        },
        downPayment: {
          type: DataTypes.TINYINT.UNSIGNED,
          allowNull: false,
          field: "down_payment",
          comment: "percentage",
        },
        sellingPrice: {
          type: DataTypes.TINYINT.UNSIGNED,
          allowNull: true,
          field: "selling_price",
          comment: "percentage",
        },
        soldUnitsMin: {
          type: DataTypes.SMALLINT.UNSIGNED,
          allowNull: true,
          field: "sold_units_min",
        },
        soldUnitsMax: {
          type: DataTypes.SMALLINT.UNSIGNED,
          allowNull: true,
          field: "sold_units_max",
        },
        commission: {
          type: DataTypes.FLOAT.UNSIGNED,
          allowNull: false,
        },
        classifiedCredits: {
          type: DataTypes.FLOAT.UNSIGNED,
          allowNull: true,
          field: "classified_credits",
        },
        additionalCommission: {
          type: DataTypes.FLOAT.UNSIGNED,
          allowNull: true,
          field: "additional_commission",
          comment: "Applicable on 50% down payment",
        },
        totalCommission: {
          type: DataTypes.FLOAT.UNSIGNED,
          allowNull: true,
          field: "total_commission",
        },
      },
      {
        sequelize,
        tableName: "zn_pf_affiliate_commission",
      }
    );
  }
}

export default AffiliateCommission;
