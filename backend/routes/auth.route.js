import express from "express";
import {
  registerValidation,
  loginValidation,
} from "../middlewares/validation.js";
import {
  registerUser,
  loginUser,
} from "../controllers/auth.controller.js"; 

const router = express.Router();
 
router.post("/auth/register", registerValidation, registerUser);
router.post("/auth/login", loginValidation, loginUser);
 
 
export default router;
