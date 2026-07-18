import { DataTypes } from "sequelize";
import { BaseSeqModel, sequelize } from "../config/database.js";

class Activity extends BaseSeqModel {
  get actor() {
    if (this.dataValues.actor) {
      return this.dataValues.actor;
    }
    return this.getDataValue("actorId");
  }

  set actor(val) {
    if (val && typeof val === "object" && val.id) {
      this.setDataValue("actorId", val.id);
      this.dataValues.actor = val;
    } else {
      this.setDataValue("actorId", val);
      this.dataValues.actor = null;
    }
  }
}

Activity.init(
  {
    id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    actorId: {
      type: DataTypes.STRING(24),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: "Activity",
    tableName: "Activities",
    timestamps: true,
    hooks: {
      beforeCreate: async (activity) => {
        if (!activity.id) {
          activity.id = Activity.generateId();
        }
      },
    },
    indexes: [
      {
        fields: ["createdAt"],
      },
      {
        fields: ["type", "createdAt"],
      },
    ],
  }
);

export default Activity;
