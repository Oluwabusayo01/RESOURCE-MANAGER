import { createClient } from "@supabase/supabase-js";
import { validationResult, matchedData } from "express-validator";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Library from "../models/library.model.js";

dotenv.config();

// Lazy initializer for Supabase client to prevent server crash on startup when credentials are missing
let supabaseInstance = null;
const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    return null;
  }

  supabaseInstance = createClient(url, key);
  return supabaseInstance;
};


export const uploadPdfController = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }

  try {
    const { title, course, department, description } = req.body;

    if (!title || !course || !department) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: title, course, and department are required.",
      });
    }

    const originalName = req.file.originalname;
    const fileExt = originalName.split('.').pop().toLowerCase();

    // Check file type
    const allowedExts = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"];
    if (!allowedExts.includes(fileExt)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported file extension: .${fileExt}. Allowed: ${allowedExts.join(", ").toUpperCase()}`,
      });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: "Upload failed: Supabase storage is not configured (missing SUPABASE_URL / SUPABASE_SERVICE_KEY in .env).",
      });
    }

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
        contentType: req.file.mimetype || "application/pdf",
        upsert: false,
      });

    console.log("Supabase error:", error);
    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("pdf's")
      .getPublicUrl(filename);

    // Save metadata and file URL to MongoDB
    const newMaterial = new Library({
      title,
      course,
      department: department.toLowerCase(),
      description: description || null,
      uploadedBy: req.user.name,
      user: req.user._id,
      fileType: fileExt,
      pdfUrl: urlData.publicUrl,
      fileName: originalName,
      fileSize: req.file.size,
    });

    await newMaterial.save();

    return res.status(201).json({
      success: true,
      message: "Material uploaded successfully",
      material: {
        id: newMaterial._id,
        title: newMaterial.title,
        course: newMaterial.course,
        department: newMaterial.department,
        description: newMaterial.description,
        uploadedBy: newMaterial.uploadedBy,
        uploadedById: newMaterial.user,
        fileType: newMaterial.fileType,
        fileUrl: newMaterial.pdfUrl,
        createdAt: newMaterial.createdAt,
      },
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

export const getMaterialsController = async (req, res) => {
  try {
    const { search, department, uploadedBy } = req.query;
    const query = {};

    if (department && department !== "all") {
      query.department = department.toLowerCase();
    }

    if (uploadedBy === "me") {
      let userId = req.user?._id;
      if (!userId) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          try {
            const token = authHeader.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.userId;
          } catch (err) {
            console.warn("Failed to decode token for uploadedBy='me' query:", err.message);
          }
        }
      }
      if (userId) {
        query.user = userId;
      } else {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: You must be logged in to view your own uploads.",
        });
      }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { course: { $regex: search, $options: "i" } },
      ];
    }

    const materials = await Library.find(query).sort({ createdAt: -1 });

    const formattedMaterials = materials.map((m) => ({
      id: m._id,
      title: m.title,
      course: m.course,
      department: m.department,
      description: m.description,
      uploadedBy: m.uploadedBy,
      uploadedById: m.user,
      fileType: m.fileType,
      fileUrl: m.pdfUrl,
      createdAt: m.createdAt,
    }));

    return res.status(200).json(formattedMaterials);
  } catch (error) {
    console.error("Get materials error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch materials",
      error: error.message,
    });
  }
};

export const deleteMaterialController = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Library.findById(id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    // Check authorization: only the uploader or an admin can delete
    const isUploader = material.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isUploader && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the uploader or an admin can delete this material",
      });
    }

    // Attempt to delete from Supabase storage if Supabase is configured
    const supabase = getSupabaseClient();
    if (supabase && material.pdfUrl) {
      try {
        const urlParts = material.pdfUrl.split("/");
        const filename = urlParts[urlParts.length - 1];
        if (filename) {
          await supabase.storage.from("pdf's").remove([filename]);
        }
      } catch (err) {
        console.warn("Failed to delete file from Supabase storage:", err.message);
      }
    }

    await Library.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (error) {
    console.error("Delete material error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete material",
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

export const downloadMaterialController = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Library.findById(id);
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }
    return res.status(200).json({
      success: true,
      fileUrl: material.pdfUrl,
    });
  } catch (error) {
    console.error("Download material error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch download link",
      error: error.message,
    });
  }
};


