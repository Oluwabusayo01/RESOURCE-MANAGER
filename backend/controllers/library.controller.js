import { createClient } from "@supabase/supabase-js";
import { validationResult, matchedData } from "express-validator";
import Library from "../models/library.model.js";
import multer from "multer";
import dotenv from "dotenv";
import { createNotification } from "../utils/createNotification.js";
import { createActivity } from "../utils/createActivity.js";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".ppt",
      ".pptx",
      ".xls",
      ".xlsx",
      ".txt",
    ];

    const fileName = (file.originalname || "").toLowerCase();
    const hasAllowedExtension = allowedExtensions.some((extension) =>
      fileName.endsWith(extension),
    );

    if (hasAllowedExtension) return cb(null, true);
    return cb(
      new Error(
        "Invalid file type. Allowed types: pdf, doc, docx, ppt, pptx, xls, xlsx, txt",
      ),
      false,
    );
  },
});

export const uploadFileController = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }

  try {
    const originalName = req.file.originalname;
    const sanitizedName = originalName
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toLowerCase();

    const filename = `${Date.now()}-${sanitizedName}`;
    console.log("Uploading filename:", filename);

    // Upload file to Supabase bucket
    const { error } = await supabase.storage
      .from("pdf's")
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype || "application/octet-stream",
        upsert: false,
      });

    console.log("Supabase error:", error);
    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("pdf's")
      .getPublicUrl(filename);

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      fileUrl: urlData.publicUrl,
      fileName: originalName,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    console.error("Library upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message,
    });
  }
};

export const downloadFile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: errors.array()[0].msg,
    });
  }
  
  const { fileUrl } = matchedData(req);

  return res.redirect(fileUrl);
};

export const createMaterial = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    const {
      title,
      course,
      department,
      description,
      uploadedBy,
      fileUrl,
      fileName,
      fileSize,
      fileType,
    } = matchedData(req);

    if (req.user.role !== "staff" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only staff and admin can upload materials",
      });
    }

    const material = await Library.create({
      title,
      course,
      department,
      description: description || null,
      uploadedBy,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      user: req.user.id,
    });  
    await createActivity(
      "material_uploaded",
      `${req.user.name} uploaded "${material.title}" (${material.course}).`,
      req.user.id,
    );

    return res.status(201).json({
      success: true,
      message: "Material uploaded successfully",
      data: material,
    });
  } catch (error) {
    console.error("Error creating material", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateMaterial = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    const {
      title,
      course,
      department,
      description,
      uploadedBy,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      id,
    } = matchedData(req);

    const material = await Library.findById(id);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    if (req.user.role !== "admin" && material.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this material",
      });
    }

    if (title) material.title = title;
    if (course) material.course = course;
    if (department) material.department = department;
    if (description) material.description = description;
    if (uploadedBy) material.uploadedBy = uploadedBy;
    if (fileUrl) material.fileUrl = fileUrl;
    if (fileName) material.fileName = fileName;
    if (fileSize) material.fileSize = fileSize;
    if (fileType) material.fileType = fileType;

    await material.save();

    await createNotification(
      material.user,
      "system",
      `Your material "${material.title}" has been updated.`,
    );
    await createActivity(
      "material_updated",
      `${req.user.name} updated material "${material.title}".`,
      req.user.id,
    );
  
    return res.status(200).json({
      success: true,
      message: "Material updated successfully",
      data: material,
    });
  } catch (error) {
    console.error("Error updating material", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const deleteMaterial = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    const { id } = matchedData(req);

    const material = await Library.findById(id);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    if (req.user.role !== "admin" && material.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this material",
      });
    }

    await createNotification(
      material.user,
      "system",
      `Your material "${material.title}" has been deleted.`,
    );
    await createActivity(
      "material_deleted",
      `${req.user.name} deleted material "${material.title}".`,
      req.user.id,
    );

    await Library.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting material", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getSingleMaterial = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }
  try {
    const { id } = matchedData(req);

    const material = await Library.findById(id).lean();
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: material,
    });
  } catch (error) {
    console.error("Error getting material", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getAllLibraryMaterials = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    const {
      search,
      department,
      page: pageParam,
      limit: limitParam,
    } = matchedData(req, { locations: ["query"] });

    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (department) filter.department = department;

    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { title: searchRegex },
        { course: searchRegex },
        { department: searchRegex },
        { uploadedBy: searchRegex },
      ];
    }

    const [materials, total] = await Promise.all([
      Library.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Library.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: materials,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error getting library materials", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getMyLibraryMaterials = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({
        success: false,
        message: "Only staff can access this route",
      });
    }

    const {
      search,
      department,
      page: pageParam,
      limit: limitParam,
    } = matchedData(req, { locations: ["query"] });

    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 10;
    const skip = (page - 1) * limit;

    const filter = { user: req.user.id };
    if (department) filter.department = department;

    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { title: searchRegex },
        { course: searchRegex },
        { department: searchRegex },
        { uploadedBy: searchRegex },
      ];
    }

    const [materials, total] = await Promise.all([
      Library.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Library.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: materials,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error getting staff library materials", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
