import express from "express";
import { verifiedUser } from "../middlewares/verifiedUser.js";
import {
  cancelBookingValidation,
  createBookingValidation,
  updateBookingValidation,
  getBookingsValidation,
} from "../middlewares/validation.js";
import {
  createBooking,
  updateBooking,
  cancelBooking,
  getPublicBookings,
  getAllBookings,
} from "../controllers/booking.controller.js";

const router = express.Router();

router.get("/bookings/public", getBookingsValidation, getPublicBookings);
router.get("/bookings/", verifiedUser, getBookingsValidation, getAllBookings);
router.post("/bookings", verifiedUser, createBookingValidation, createBooking);
router.patch(
  "/bookings/:id",
  verifiedUser,
  updateBookingValidation,
  updateBooking,
);
router.patch(
  "/bookings/cancel/:id",
  verifiedUser,
  cancelBookingValidation,
  cancelBooking,
);

export default router;
