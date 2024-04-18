import { ListingStatusKey } from "@pf/taxonomies";
import { DataTypes, Model, Sequelize } from "sequelize";

class ListingStatus extends Model {
  public id!: number;
  public name!: string | null;
  public key!: ListingStatusKey;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
          field: "status_id",
        },
        name: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: "title",
        },
        key: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
        },
      },
      {
        sequelize,
        tableName: "zn_pf_listing_status",
        updatedAt: false,
      }
    );
  }
}

export default ListingStatus;
