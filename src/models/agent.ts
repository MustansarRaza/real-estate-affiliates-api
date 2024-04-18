import { DataTypes, Model, Sequelize } from "sequelize";

class Agent extends Model {
  public id!: number;
  public isTest!: boolean;

  static setup(sequelize: Sequelize): void {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER({ length: 11, unsigned: true }),
          primaryKey: true,
          allowNull: false,
          autoIncrement: true,
          field: "agentid",
        },
        isTest: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: 0,
          field: "is_test",
        },
      },
      {
        sequelize,
        createdAt: false,
        updatedAt: false,
        tableName: "zn_agents",
      }
    );
  }
}

export default Agent;
