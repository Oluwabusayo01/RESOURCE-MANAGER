import express from "express";
import { verifiedUser } from "../middlewares/verifiedUser.js";
import { getNotificationsValidation } from "../middlewares/validation.js";
import { getMyNotifications } from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/notifications", verifiedUser, getNotificationsValidation, getMyNotifications);

export default router;
