import { Sequelize, Model, DataTypes } from "sequelize";

class MediaBankImage extends Model {
  public id!: number;
  public fileName!: string;
  public key!: string;

  public createdAt!: Date;
  public updatedAt!: Date;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        fileName: {
          type: new DataTypes.STRING(100),
          allowNull: false,
          field: "file_name",
        },
        key: {
          type: new DataTypes.STRING(255),
          allowNull: false,
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
      },
      {
        sequelize,
        tableName: "zn_pf_property_media_bank",
      }
    );
  }
}

export default MediaBankImage;
