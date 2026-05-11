import { body, query, param } from "express-validator";

export const registerValidation = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters long"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email address")
    .custom((value) => value.toLowerCase().endsWith("@student.lautech.edu.ng"))
    .withMessage("Enter a valid LAUTECH email address"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("department")
    .notEmpty()
    .withMessage("Department is required")
    .isIn(["computer science", "cyber security", "imformation system"])
    .withMessage("Invalid Department"),

  body("role")
    .optional()
    .isIn(["classrep", "staff", "admin"])
    .withMessage("Invalid Role"),
];

export const loginValidation = [
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email address"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

export const getAllUsersValidation = [
  query("status")
    .optional()
    .isIn(["pending", "approved", "rejected"])
    .withMessage("Invalid status"),

  query("role")
    .optional()
    .isIn(["admin", "staff", "classrep"])
    .withMessage("Invalid role"),

  query("department")
    .optional()
    .isIn([
      "computer science",
      "cyber security",
      "imformation system",
      "information system",
    ])
    .withMessage("Invalid department"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Limit must be a positive integer"),
];


export const approveOrRejectUserValidation = [
  param("id")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid User ID")
];