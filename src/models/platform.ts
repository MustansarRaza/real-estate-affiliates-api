import { DataTypes, Model, Sequelize } from "sequelize";

class Platform extends Model {
  public id!: number;
  public platformKey!: string;
  public platformTitle!: string;
  public latitude!: number;
  public longitude!: number;
  public currencyUnit!: string;
  public createdAt!: Date | null;
  public updatedAt!: Date | null;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        platformKey: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: "paltform_key",
        },
        platformTitle: {
          type: DataTypes.STRING(100),
          allowNull: false,
          field: "platform_title",
        },
        latitude: {
          type: DataTypes.DOUBLE,
          allowNull: false,
        },
        longitude: {
          type: DataTypes.DOUBLE,
          allowNull: false,
        },
        currencyUnit: {
          type: DataTypes.STRING(20),
          allowNull: false,
          field: "currency_unit",
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "created_at",
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "updated_at",
        },
      },
      {
        sequelize,
        tableName: "agency-platforms",
      }
    );
  }
}

export default Platform;
