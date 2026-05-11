import express from "express";
import {verifiedUser} from "../middlewares/verifiedUser.js";
import isAdmin from "../middlewares/isAdmin.js";
import { getAllUsers, rejectUser, approveUser } from "../controllers/user.controller.js"; 
import {
  approveOrRejectUserValidation,
  getAllUsersValidation,
} from "../middlewares/validation.js";

const router = express.Router();
 
router.get("/users", verifiedUser, isAdmin, getAllUsersValidation, getAllUsers);
router.patch(
  "/users/:id/approve",
  verifiedUser,
  isAdmin,
  approveOrRejectUserValidation,
  approveUser,
);
router.patch("/users/:id/reject", verifiedUser, isAdmin, approveOrRejectUserValidation, rejectUser);
 
export default router;
