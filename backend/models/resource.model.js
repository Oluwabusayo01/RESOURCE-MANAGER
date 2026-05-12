import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      required: true,
      //   enum: ["lab", "seminar", "hall", "equipment", "meeting"],
    },
    description: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Resource", resourceSchema);
