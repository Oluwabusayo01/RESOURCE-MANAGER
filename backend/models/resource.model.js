import { DataTypes } from "sequelize";
import { BaseSeqModel, sequelize } from "../config/database.js";

class Resource extends BaseSeqModel {}

Resource.init(
  {
    id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.ENUM("available", "unavailable"),
      allowNull: false,
      defaultValue: "available",
    },
  },
  {
    sequelize,
    modelName: "Resource",
    tableName: "Resources",
    timestamps: true,
    hooks: {
      beforeCreate: async (resource) => {
        if (!resource.id) {
          resource.id = Resource.generateId();
        }
      },
    },
  }
);

export default Resource;
