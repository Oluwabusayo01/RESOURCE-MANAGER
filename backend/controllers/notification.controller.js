import { validationResult, matchedData } from "express-validator";
import Notification from "../models/notification.model.js";

export const getMyNotifications = async (req, res, next) => {
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

    const filter = { user: req.user.id };

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
      },
    });
  } catch (error) {
    console.error("Error getting notifications", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
