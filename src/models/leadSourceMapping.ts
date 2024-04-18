import { Sequelize, Model, DataTypes } from "sequelize";

class LeadSourceMapping extends Model {
  public inquiryId!: number;
  public inquirySourceId!: number;
  public inquirySourceValue!: string;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        inquiryId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          field: "inquiry_id",
        },
        inquirySourceId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          field: "inquiry_source_id",
        },
        inquirySourceValue: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: "inquiry_source_value",
        },
      },
      {
        sequelize,
        createdAt: false,
        updatedAt: false,
        timestamps: false,
        tableName: "zn_internal_inquiries_source_mapping",
      }
    );
  }
}

export default LeadSourceMapping;
