import express from "express";
import { validationResult, matchedData } from "express-validator";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import { registrationApprovedEmailTemplate } from "../emailTemplates/registrationApproved.template.js";
import { registrationRejectedEmailTemplate } from "../emailTemplates/registrationRejected.template.js";

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
    } = matchedData(req, { locations: ["query"] });

    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 10;
    const skip = (page - 1) * limit;
    console.log("Filters:", { status, role, department });

    const filter = {};
    if (status) filter.status = status;
    if (role) filter.role = role;
    if (department) {
      filter.department =
        department === "information system" ? "information system" : department;
    }

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

export const approveUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    const { id } = matchedData(req);

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "User is already approved",
      });
    }

    if (user.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Cannot approved an already rejected user",
      });
    }

    user.status = "approved";
    await user.save();

    sendEmail({
      to: user.email,
      ...registrationApprovedEmailTemplate(user.name),
    }).catch((emailError) => {
      console.error("Failed to send approval email:", emailError.message);
    });

    return res.status(200).json({
      success: true,
      message: "User approved successfully",
    });
  } catch (error) {
    console.log("Error while approving user:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const rejectUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    const { id } = matchedData(req);

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "User is already rejected",
      });
    }

    if (user.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Cannot reject an already approved user",
      });
    }

    user.status = "rejected";
    await user.save();

    sendEmail({
      to: user.email,
      ...registrationRejectedEmailTemplate(user.name),
    }).catch((emailError) => {
      console.error("Failed to send rejection email:", emailError.message);
    });

    return res.status(200).json({
      success: true,
      message: "User rejected successfully",
    });
  } catch (error) {
    console.error("Error while rejecting user:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


