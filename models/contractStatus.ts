import { DataTypes, Model, Sequelize } from "sequelize";

class ContractStatus extends Model {
  public id!: number;
  public name!: string | null;
  public key!: string;
  public order!: number;
  public isActive!: number | null;
  public createdAt!: Date | null;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "cstatus_id",
        },
        name: {
          type: DataTypes.STRING(50),
          allowNull: true,
          field: "title",
        },
        key: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
          field: "key",
        },
        order: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: "display_order",
        },
        isActive: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: "is_active",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "date_added",
        },
      },
      {
        sequelize,
        tableName: "zn_pf_contract_status",
        updatedAt: false,
      }
    );
  }
}

export default ContractStatus;
