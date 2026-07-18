import { DataTypes } from "sequelize";
import { BaseSeqModel, sequelize } from "../config/database.js";

class Booking extends BaseSeqModel {
  get resource() {
    if (this.dataValues.resource) {
      return this.dataValues.resource;
    }
    return this.getDataValue("resourceId");
  }
  set resource(val) {
    if (val && typeof val === "object" && val.id) {
      this.setDataValue("resourceId", val.id);
      this.dataValues.resource = val;
    } else {
      this.setDataValue("resourceId", val);
      this.dataValues.resource = null;
    }
  }

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

  get cancelledBy() {
    if (this.dataValues.cancelledBy) {
      return this.dataValues.cancelledBy;
    }
    return this.getDataValue("cancelledById");
  }
  set cancelledBy(val) {
    if (val && typeof val === "object" && val.id) {
      this.setDataValue("cancelledById", val.id);
      this.dataValues.cancelledBy = val;
    } else {
      this.setDataValue("cancelledById", val);
      this.dataValues.cancelledBy = null;
    }
  }
}

Booking.init(
  {
    id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
    },
    resourceId: {
      type: DataTypes.STRING(24),
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING(24),
      allowNull: false,
    },
    course: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("confirmed", "cancelled", "completed"),
      allowNull: false,
      defaultValue: "confirmed",
    },
    attendance: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    department: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    cancelledById: {
      type: DataTypes.STRING(24),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: "Booking",
    tableName: "Bookings",
    timestamps: true,
    hooks: {
      beforeCreate: async (booking) => {
        if (!booking.id) {
          booking.id = Booking.generateId();
        }
      },
    },
    indexes: [
      {
        fields: ["resourceId", "date", "status"],
      },
    ],
  }
);

export default Booking;
