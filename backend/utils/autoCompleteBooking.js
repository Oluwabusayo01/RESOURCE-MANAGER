
import Booking from "../models/booking.model.js";

export const autoCompleteBookings = async () => {
  const now = new Date();
  const today = now.toISOString().split("T")[0]; // "2026-05-14"
  const currentTime = now.toTimeString().slice(0, 5); // "10:30"

  await Booking.updateMany(
    {
      status: "confirmed",
      $or: [
        { date: { $lt: today } }, 
        { date: today, endTime: { $lte: currentTime } }, 
      ],
    },
    { $set: { status: "completed" } },
  );
};
