import express from "express";
import { verifiedUser } from "../middlewares/verifiedUser.js";
import {
  cancelBookingValidation,
  createBookingValidation,
  updateBookingValidation,
  getBookingsValidation,
  getSingleBookingValidation,
  updateBookingAttendanceValidation,
} from "../middlewares/validation.js";
import {
  createBooking,
  updateBooking,
  cancelBooking,
  getPublicBookings,
  getAllBookings,
  getSingleBooking,
  updateBookingAttendance,
} from "../controllers/booking.controller.js";

const router = express.Router();

router.get("/bookings/public", getBookingsValidation, getPublicBookings);
router.get("/bookings/", verifiedUser, getBookingsValidation, getAllBookings);
router.post("/bookings", verifiedUser, createBookingValidation, createBooking);
router.get("/bookings/:id", getSingleBookingValidation, getSingleBooking);
router.patch(
  "/bookings/:id",
  verifiedUser,
  updateBookingValidation,
  updateBooking,
);   
router.patch(
  "/bookings/:id/attendance",
  verifiedUser,
  updateBookingAttendanceValidation,
  updateBookingAttendance,
);
router.patch(
  "/bookings/cancel/:id",
  verifiedUser,
  cancelBookingValidation,
  cancelBooking,
);

export default router;
