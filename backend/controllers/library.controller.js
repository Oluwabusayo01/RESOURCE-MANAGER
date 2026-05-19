import { createClient } from "@supabase/supabase-js";
import { validationResult, matchedData } from "express-validator";
import dotenv from "dotenv";


dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,  
  process.env.SUPABASE_SERVICE_KEY,
);

export const uploadPdfController = async (req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });

  try { 
                
    const originalName = req.file.originalname; 
    const sanitizedName = originalName
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toLowerCase();  

    const filename = `${Date.now()}-${sanitizedName}`;
    console.log("Uploading filename:", filename);

    const { error } = await supabase.storage
      .from("pdf's") 
      .upload(filename, req.file.buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    console.log("Supabase error:", error);
    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("pdf's")
      .getPublicUrl(filename);

    return res.status(200).json({
      success: true,
      message: "PDF uploaded successfully",
      pdfUrl: urlData.publicUrl,
      fileName: originalName,
      fileSize: req.file.size,
    });
  } catch (error) {
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
