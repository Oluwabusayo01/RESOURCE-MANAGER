import express from "express";
import {verifiedUser} from "../middlewares/verifiedUser.js";
import isAdmin from "../middlewares/isAdmin.js";
import {
  createResourceValidation,
  getAllResourcesValidation,
  updateResourceValidation,
} from "../middlewares/validation.js";
import {
  createResource,
  updateResource,
  getAllResources,
} from "../controllers/resource.controller.js";
  

const router = express.Router();

router.get("/resources", verifiedUser, getAllResourcesValidation, getAllResources)
router.post("/resources", verifiedUser, isAdmin, createResourceValidation, createResource);
router.patch("/resources/:id", verifiedUser, isAdmin, updateResourceValidation, updateResource);
export default router;
