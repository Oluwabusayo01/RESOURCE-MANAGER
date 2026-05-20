import express from "express";
import multer from "multer";
import {
  uploadFileController,
  downloadFile,
} from "../controllers/library.controller.js";
import { verifiedUser } from "../middlewares/verifiedUser.js";
import { downloadFileValidation } from "../middlewares/validation.js";
import { multerErrorHandler } from "../middlewares/multerErrorHandler.js";

const router = express.Router();

const upload = multer({
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
      new Error("Invalid file type. Allowed types: pdf, doc, docx, ppt, pptx, xls, xlsx, txt"),
      false,
    );
  },
});


router.post(
  "/library/upload-file",
  verifiedUser,
  upload.single("file"),
  multerErrorHandler,
  uploadFileController,
);

router.get("/library/download-file", downloadFileValidation, downloadFile);

export default router;
