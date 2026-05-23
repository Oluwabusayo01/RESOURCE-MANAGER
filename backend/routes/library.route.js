import express from "express";
import {
  uploadFileController,
  downloadFile,
  upload,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getSingleMaterial,
  getAllLibraryMaterials,
  getMyLibraryMaterials,
} from "../controllers/library.controller.js";
import { verifiedUser } from "../middlewares/verifiedUser.js";
import {
  downloadFileValidation,
  getLibraryMaterialsValidation,
  uploadMaterialValidation,
  updateMaterialValidation,
  deleteMaterialValidation,
  getSingleMaterialValidation,
} from "../middlewares/validation.js";
import { multerErrorHandler } from "../middlewares/multerErrorHandler.js";

const router = express.Router();

router.get("/library", getLibraryMaterialsValidation, getAllLibraryMaterials);
router.get(
  "/library/staff",
  verifiedUser,
  getLibraryMaterialsValidation,
  getMyLibraryMaterials,
);
router.post("/library", verifiedUser, uploadMaterialValidation, createMaterial);

// GET list of materials
router.get("/library", getMaterialsController);

// Support both /library/upload-pdf and /library/upload-file for flexibility
router.post(
  "/library/upload-file",
  verifiedUser,
  upload.single("file"),
  multerErrorHandler,
  uploadFileController,
);

router.get("/library/download-file", downloadFileValidation, downloadFile);
router.patch(
  "/library/:id",
  verifiedUser,
  updateMaterialValidation,
  updateMaterial,
);
router.delete(
  "/library/:id",
  verifiedUser,
  deleteMaterialValidation,
  deleteMaterial,
);
router.get("/library/:id", getSingleMaterialValidation, getSingleMaterial);

export default router;

