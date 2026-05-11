import express from "express";
import {verifiedUser} from "../middlewares/verifiedUser.js";
import isAdmin from "../middlewares/isAdmin.js";
import {
  getAllUsers,
} from "../controllers/user.controller.js"; 
import { getAllUsersValidation } from "../middlewares/validation.js";

const router = express.Router();
 
router.get("/users", verifiedUser, isAdmin, getAllUsersValidation, getAllUsers);
 
 
export default router;
