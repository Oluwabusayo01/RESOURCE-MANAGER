import express from "express";
import { verifiedUser } from "../middlewares/verifiedUser.js";
import isAdmin from "../middlewares/isAdmin.js";
import { getActivityValidation } from "../middlewares/validation.js";
import {
  getAdminStats,
  getBookingsByDepartment,
  getPeakHours,
  getAllActivity,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/admin/stats", verifiedUser, isAdmin, getAdminStats);
router.get(
  "/admin/analytics/by-department",
  verifiedUser,
  isAdmin,
  getBookingsByDepartment,
);   
router.get("/admin/analytics/peak-hours", verifiedUser, isAdmin, getPeakHours);
router.get(
  "/admin/activity",
  verifiedUser,
  isAdmin,
  getActivityValidation,
  getAllActivity,
);

export default router;
  
