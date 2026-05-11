import { body, param } from "express-validator";

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
  param("status")
    .optional()
    .isIn(["processing", "approved", "rejected"])
    .withMessage("Invalid status"),

  param("role")
    .optional()
    .isIn(["admin", "staff", "classrep"])
    .withMessage("Invalid role"),

  param("department")
    .optional()
    .isIn(["computer science", "cyber security", "information system"])
    .withMessage("Invalid department"),

    param("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  param("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Limit must be a positive integer"),
];
