import express from "express";
import { upload, uploadImage } from "../controllers/uploadImage.controller.js";
import { multerErrorHandler } from "../middlewares/multerErrorHandler.js";
import { verifiedUser } from "../middlewares/verifiedUser.js";
const router = express.Router();

router.post(
  "/upload-image",
  verifiedUser,
  upload.single("image"),
  multerErrorHandler,
  uploadImage,
);

export default router;
