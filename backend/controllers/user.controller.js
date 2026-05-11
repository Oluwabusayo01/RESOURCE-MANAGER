import express from "express";
import { validationResult, matchedData } from "express-validator";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

export const getAllUsers = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    const {
      status,
      role,
      department,
      page: pageParam,
      limit: limitParam,
    } = matchedData(req);

    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (role) filter.role = role;
    if (department) filter.department = department;

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("-password -__v") 
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(), 
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
        hasNextPage: page * limit < totalUsers,
      },
    });
  } catch (error) {
    console.error("Error while getting users:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
