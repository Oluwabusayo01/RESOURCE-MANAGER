import { validationResult, matchedData } from "express-validator";
import User from "../models/user.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import { registrationEmailTemplate } from "../emailTemplates/registrationPending.template.js";
import generateToken from "../utils/generateToken.js";

export const registerUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    const { name, email, password, department, role } = matchedData(req);

    const existingUser = await User.findOne({ email }).lean(); 
    if (existingUser) {
      return res.status(409).json({
        statusCode: 409,
        success: false,
        message: "Email already exists",
      });
    }

    const newUser = new User({ name, email, password, department, role });
    await newUser.save();

    sendEmail({
      to: email,
      ...registrationEmailTemplate(name),
    }).catch((emailError) => {
      console.error("Failed to send registration email:", emailError.message);
    });

    return res.status(201).json({
      statusCode: 201,
      success: true,
      message: "User registered successfully, await admin approval",
    });
  } catch (error) {
    console.error("Error during user registration:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const loginUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    const { email, password } = matchedData(req);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        statusCode: 401,
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.status !== "approved") {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        message:
          "Your account is not approved yet. Please wait for admin approval.",
      });
    }

    const token = generateToken(user._id, user.role, user.status);

    // exclude password from response
    const { password: _, ...userWithoutPassword } = user.toObject();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      user: userWithoutPassword,
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Error during user login:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
