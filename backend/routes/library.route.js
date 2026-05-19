import express from "express";
import multer from "multer";
import { uploadPdfController, downloadFile } from "../controllers/library.controller.js";
import { verifiedUser } from "../middlewares/verifiedUser.js";
import { downloadFileValidation } from "../middlewares/validation.js";
import { multerErrorHandler } from "../middlewares/multerErrorHandler.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    return cb(new Error("Only PDF files are allowed"), false);
  },  
});

router.post(
  "/library/upload-pdf",
  verifiedUser,
  upload.single("file"),
  multerErrorHandler,
  uploadPdfController,
);

router.get("/library/download", downloadFileValidation, downloadFile);

export default router;
