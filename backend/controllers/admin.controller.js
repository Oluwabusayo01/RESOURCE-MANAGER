import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import Activity from "../models/activity.model.js";
import { validationResult, matchedData } from "express-validator";

export const getAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const [
      totalBookingsThisMonth,
      pendingUsers,               
      totalUsers,
      mostBookedResourceAggregation,  
    ] = await Promise.all([                                                                 
      Booking.countDocuments({
        createdAt: {                               
          $gte: startOfMonth,
          $lt: startOfNextMonth,
        },
      }),  
      User.countDocuments({ status: "pending" }),
      User.countDocuments(),
      Booking.aggregate([
        {
          $group: {
            _id: "$resource",
            bookingCount: { $sum: 1 },
          },   
        },
        { $sort: { bookingCount: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: "resources",
            localField: "_id",
            foreignField: "_id",
            as: "resource",
          },
        },
        {
          $unwind: {
            path: "$resource",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            id: "$resource._id",
            name: "$resource.name",
            bookingCount: 1,
          },
        },
      ]),
    ]);  

    const mostBookedResource = mostBookedResourceAggregation[0] || null;

    return res.status(200).json({
      success: true,
      data: {
        totalBookingsThisMonth,
        pendingUsers,
        totalUsers,
        mostBookedResource,
      },
    });
  } catch (error) {
    console.error("Error while getting admin stats:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getBookingsByDepartment = async (req, res) => {
  try {
    const departmentCounts = await Booking.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const formatDepartment = (department) => {
      const normalized = (department || "").toLowerCase().trim();

      if (normalized === "computer science") return "Computer Science";
      if (normalized === "cyber security") return "Cyber Security";
      if (normalized === "information system") {
        return "Information Systems Sciences (INS)";
      }
   
      return department || "Unknown";
    };

    const data = departmentCounts.map((item) => ({
      department: formatDepartment(item._id),
      count: item.count,
    }));

    return res.status(200).json({
      success: true,
      data,  
    });  
  } catch (error) {
    console.error("Error while getting bookings by department:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });     
  }
};

export const getPeakHours = async (req, res) => {
  try {
    const peakHoursAggregation = await Booking.aggregate([
      {
        $match: {
          startTime: { $type: "string" },
        },
      },
      {
        $project: {
          hour: {
            $concat: [{ $substrBytes: ["$startTime", 0, 2] }, ":00"],
          },
        },
      },
      {
        $group: {
          _id: "$hour",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const countByHour = new Map(
      peakHoursAggregation.map((item) => [item._id, item.count]),
    );

    const data = Array.from({ length: 14 }, (_, index) => {
      const hour = `${String(index + 6).padStart(2, "0")}:00`;
      return {
        hour,
        count: countByHour.get(hour) || 0,
      };
    });

    return res.status(200).json({
      success: true,
      data,  
    }); 
  } catch (error) {
    console.error("Error while getting peak hours:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
  
export const getAllActivity = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: errors.array()[0].msg,
    });
  }
  
  try {   
    const { page: pageParam, limit: limitParam } = matchedData(req, {
      locations: ["query"],
    });
    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 10;
    const skip = (page - 1) * limit;
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentActivityFilter = { createdAt: { $gte: since } };

    const [activities, total] = await Promise.all([
      Activity.find(recentActivityFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Activity.countDocuments(recentActivityFilter),
    ]);

    const data = activities.map((activity) => ({
      _id: activity._id,
      id: activity._id,
      type: activity.type,
      description: activity.description,
      timestamp: activity.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,  
        page,   
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },  
    });
  } catch (error) {
    console.error("Error while getting activity:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
     
