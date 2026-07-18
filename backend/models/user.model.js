import { DataTypes } from "sequelize";
import { BaseSeqModel, sequelize } from "../config/database.js";
import bcrypt from "bcryptjs";

class User extends BaseSeqModel {
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isLautechEmail(value) {
          if (!value.toLowerCase().endsWith("lautech.edu.ng")) {
            throw new Error("Enter a valid LAUTECH email address");
          }
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    department: {
      type: DataTypes.ENUM("computer science", "cyber security", "information system"),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("classrep", "staff", "admin"),
      allowNull: false,
      defaultValue: "classrep",
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "Users",
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (!user.id) {
          user.id = User.generateId();
        }
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;
