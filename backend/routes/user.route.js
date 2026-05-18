import express from "express";
import {verifiedUser} from "../middlewares/verifiedUser.js";
import isAdmin from "../middlewares/isAdmin.js";
import { getAllUsers, rejectUser, approveUser, revokeUser } from "../controllers/user.controller.js"; 
import {
  approveOrRejectUserValidation,
  getAllUsersValidation,
  revokeUserValidation,
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
 router.patch(
   "/users/:id/revoke",
   verifiedUser,
   isAdmin,
   revokeUserValidation,
   revokeUser,
 );  

export default router;
