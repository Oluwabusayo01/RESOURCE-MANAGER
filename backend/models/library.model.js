import mongoose from "mongoose";

const librarySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    course: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    uploadedBy: {
      type: String, 
      required: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileType: {
      type: String,
      enum: ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"],
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number, // bytes
      required: true,
    }
  },
  { timestamps: true },
);

export default mongoose.model("Library", librarySchema);
