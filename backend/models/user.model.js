import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (value) {
          return value.toLowerCase().endsWith("@lautech.edu.ng");
        },
        message: "Enter a valid LAUTECH email address",
      },
    },
    password: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
      enum: ["computer science", "cyber security", "information system"],
      trim: true,
    },
    role: {
      type: String,
      enum: ["classrep", "staff", "admin"],
      default: "classrep",
      required: true,
    },    
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
