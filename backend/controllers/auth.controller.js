import express from "express";
import { validationResult, matchedData } from "express-validator";

import dotenv from "dotenv";
import User from "../models/user.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import { registrationEmailTemplate } from "../emailTemplates/registrationPending.template.js";
import generateToken from "../utils/generateToken.js";

dotenv.config();

export const registerUser = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // If there are validation errors, return the first error message
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    const { name, email, password, department, role } = matchedData(req);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Email already exists",
      });
    }

    const newUser = new User({
      name,
      email,
      password,  
      department, 
      role
    });

    await newUser.save();

    try {
      const { subject, text, html } = registrationEmailTemplate(name);
      await sendEmail({
        to: email,
        subject,
        text,
        html,
      });
    } catch (emailError) {
      console.error("Failed to send registration pending email:", emailError.message);
    }

    return res.status(201).json({
      statusCode: 201,
      success: true,
      message: "User registered successfully, await admin approval",
    });

  } catch (error) {
    console.log("Error during user registration:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


export const loginUser = async (req, res)=>{

 const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // If there are validation errors, return the first error message
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: errors.array()[0].msg,
    });
  }
  try {
      const {email, password } = matchedData(req);

       const user = await User.findOne({ email });
       if (!user) {
         return res.status(400).json({
           statusCode: 400,
           success: false,
           message: "User not found",
         });
       }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({
          statusCode: 400,
          success: false,
          message: "Invalid credentials",
        });
      }

      if (user.status !== "approved") {
        return res.status(403).json({
          statusCode: 403,
          success: false,
          message: "Your account is not approved yet. Please wait for admin approval before logging in.",
        });
      }

      const token = generateToken(user._id, user.role, user.status);

      return res.status(200).json({
          statusCode: 200,
          success: true,
          message: "Login successful",
          token,
      });

  } catch (error) {
    console.log("Error during user login:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}
