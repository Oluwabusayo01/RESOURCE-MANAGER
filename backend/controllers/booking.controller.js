import Booking from "../models/booking.model.js";
import Resource from "../models/resource.model.js";
import { validationResult, matchedData } from "express-validator";
import { autoCompleteBookings } from "../utils/autoCompleteBooking.js";

export const createBooking = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    await autoCompleteBookings();

    const {
      resource: resourceId,
      course,
      notes,
      date,
      startTime,
      endTime,
    } = matchedData(req);

    // 1. Check resource exists
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    // 2. Check resource is not under maintenance
    if (resource.status === "unavailable") {
      return res.status(400).json({
        success: false,
        message: "This resource is currently unavailable",
      });
    }

    // 3. Conflict check — any confirmed booking on same resource + date that overlaps
    const conflict = await Booking.findOne({
      resource: resourceId,
      date,
      status: "confirmed",
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `This resource is already booked from ${conflict.startTime} to ${conflict.endTime} on ${conflict.date}`,
      });
    }

    // 4. Create booking — pull department from the logged in user
    const newBooking = await Booking.create({
      resource: resourceId,
      user: req.user.id,
      course,
      notes,
      date,
      startTime,
      endTime,
      department: req.user.department,
    });

    // 5. Populate resource and user for the response
    await newBooking.populate([
      { path: "resource", select: "name type capacity status image" },
      { path: "user", select: "name role department" },
    ]);

    return res.status(201).json({
      success: true,
      message: "Booking confirmed",
      data: newBooking,
    });
  } catch (error) {
    console.error("Error creating booking", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateBooking = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    await autoCompleteBookings();
    const { id, course, notes, date, startTime, endTime } = matchedData(req);

    // 1. Check booking exists
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 2. Check ownership — staff/classrep can only update their own
    if (req.user.role !== "admin" && booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this booking",
      });
    }

    // 3. Can only update confirmed bookings
    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${booking.status} booking`,
      });
    }

    // 4. Resolve final date, startTime, endTime for conflict check
    // Use new values if provided, fall back to existing ones
    const resolvedDate = date || booking.date;
    const resolvedStartTime = startTime || booking.startTime;
    const resolvedEndTime = endTime || booking.endTime;

    // 5. Conflict check — exclude the current booking from the check
    const conflict = await Booking.findOne({
      _id: { $ne: id }, // exclude current booking
      resource: booking.resource,
      date: resolvedDate,
      status: "confirmed",
      startTime: { $lt: resolvedEndTime },
      endTime: { $gt: resolvedStartTime },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: `This resource is already booked from ${conflict.startTime} to ${conflict.endTime} on ${conflict.date}`,
      });
    }

    // 6. Apply updates
    if (course) booking.course = course;
    if (notes) booking.notes = notes;
    if (date) booking.date = date;
    if (startTime) booking.startTime = startTime;
    if (endTime) booking.endTime = endTime;

    await booking.save();

    await booking.populate([
      { path: "resource", select: "name type capacity status image" },
      { path: "user", select: "name role department" },
    ]);

    return res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Error updating booking", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    await autoCompleteBookings();

    const { id } = matchedData(req);

    // 1. Check booking exists
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 2. Check ownership — staff/classrep can only cancel their own
    if (req.user.role !== "admin" && booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this booking",
      });
    }

    // 3. Can only cancel confirmed bookings
    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed booking",
      });
    }

    // 4. Cancel it
    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user.id;

    await booking.save();

    await booking.populate([
      { path: "resource", select: "name type capacity status, image" },
      { path: "user", select: "name role department" },
      { path: "cancelledBy", select: "name role" },
    ]);

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Error cancelling booking", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getPublicBookings = async (req, res, next) => {
  try {
    await autoCompleteBookings();

    const {
      date,
      department,
      page: pageParam,
      limit: limitParam,
    } = matchedData(req);

    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 10;
    const skip = (page - 1) * limit;

    const filter = { status: { $in: ["confirmed", "completed"] } };

    if (date) filter.date = date;
    if (department) filter.department = department;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("resource", "name type capacity status image")
        .populate("user", "name role department")
        .sort({ date: 1, startTime: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error getting booking", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getAllBookings = async (req, res, next) => {
  try {
    await autoCompleteBookings();
    const {  
      status,  
      date,
      department,  
      resource: resourceId,
      user: userId,
      page: pageParam,
      limit: limitParam,
    } = matchedData(req);

    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    // admin sees everything, others see only their own
    if (req.user.role !== "admin") {
      filter.user = req.user.id;
    }

    // optional filters
    if (status) filter.status = status;
    if (date) filter.date = date;
    if (department) filter.department = department;
    if (resourceId) filter.resource = resourceId;

    // admin only — filter by specific user
    if (req.user.role === "admin" && userId) {
      filter.user = userId;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("resource", "name type capacity status image")
        .populate("user", "name role department")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error getting bookings", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
