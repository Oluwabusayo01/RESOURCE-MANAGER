import { DataTypes } from "sequelize";
import { BaseSeqModel, sequelize } from "../config/database.js";

class Library extends BaseSeqModel {
  get user() {
    if (this.dataValues.user) {
      return this.dataValues.user;
    }
    return this.getDataValue("userId");
  }
  set user(val) {
    if (val && typeof val === "object" && val.id) {
      this.setDataValue("userId", val.id);
      this.dataValues.user = val;
    } else {
      this.setDataValue("userId", val);
      this.dataValues.user = null;
    }
  }
}

Library.init(
  {
    id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    course: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    uploadedBy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING(24),
      allowNull: false,
    },
    fileType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    fileUrl: {
      type: DataTypes.STRING(2083),
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Library",
    tableName: "LibraryMaterials",
    timestamps: true,
    hooks: {
      beforeCreate: async (library) => {
        if (!library.id) {
          library.id = Library.generateId();
        }
      },
    },
  }
);

export default Library;
