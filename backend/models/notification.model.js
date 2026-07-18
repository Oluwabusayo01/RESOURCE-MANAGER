import { DataTypes } from "sequelize";
import { BaseSeqModel, sequelize } from "../config/database.js";

class Notification extends BaseSeqModel {
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

Notification.init(
  {
    id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING(24),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        "booking_confirmed",
        "booking_cancelled",
        "booking_updated",
        "registration_approved",
        "registration_rejected",
        "class_update",
        "system"
      ),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Notification",
    tableName: "Notifications",
    timestamps: true,
    hooks: {
      beforeCreate: async (notification) => {
        if (!notification.id) {
          notification.id = Notification.generateId();
        }
      },
    },
    indexes: [
      {
        fields: ["userId", "createdAt"],
      },
    ],
  }
);

export default Notification;
