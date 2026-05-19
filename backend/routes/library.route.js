import express from "express";
import multer from "multer";
import {
  uploadPdfController,
  getMaterialsController,
  deleteMaterialController,
  downloadMaterialController,
  downloadFile
} from "../controllers/library.controller.js";
import { verifiedUser } from "../middlewares/verifiedUser.js";
import { downloadFileValidation } from "../middlewares/validation.js";
import { multerErrorHandler } from "../middlewares/multerErrorHandler.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) return cb(null, true);
    return cb(new Error("Only document files (PDF, Word, PPT, Excel, Text) are allowed"), false);
  },  
});

// GET list of materials
router.get("/library", getMaterialsController);

// Support both /library/upload-pdf and /library/upload-file for flexibility
router.post(
  "/library/upload-pdf",
  verifiedUser,
  upload.single("file"),
  multerErrorHandler,
  uploadPdfController,
);

router.post(
  "/library/upload-file",
  verifiedUser,
  upload.single("file"),
  multerErrorHandler,
  uploadPdfController,
);

// GET download link by ID (used by frontend service)
router.get("/library/:id/download", downloadMaterialController);

// DELETE material by ID
router.delete("/library/:id", verifiedUser, deleteMaterialController);

// Legacy redirect download route
router.get("/library/download", downloadFileValidation, downloadFile);

export default router;

