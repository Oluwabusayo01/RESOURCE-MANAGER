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
    .custom((value) => value.toLowerCase().endsWith("lautech.edu.ng"))
    .withMessage("Enter a valid LAUTECH email address"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("department")
    .notEmpty()
    .withMessage("Department is required")
    .isIn(["computer science", "cyber security", "information system"])
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
      "information system",
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
    .withMessage("Invalid User ID"),
];

export const createResourceValidation = [
  body("name")
    .notEmpty()
    .withMessage("Resource name is required")
    .isString()
    .withMessage("Resource name must be a string")
    .trim(),

  body("type").notEmpty().withMessage("Resource type is required"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .trim(),

  body("capacity")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Capacity must be a positive integer"),

  body("image")
    .optional({ nullable: true })
    .isString()
    .withMessage("Image must be a string")
    .trim(),

  body("status")
    .optional()
    .isIn(["available", "unavailable"])
    .withMessage("Invalid status"),
];

export const updateResourceValidation = [
  param("id")
    .notEmpty()
    .withMessage("Resource ID is required")
    .isMongoId()
    .withMessage("Invalid Resource ID"),

  body("name")
    .optional()
    .notEmpty()
    .withMessage("Resource name cannot be empty")
    .isString()
    .withMessage("Resource name must be a string")
    .trim(),

  body("type")
    .optional()
    .notEmpty()
    .withMessage("Resource type cannot be empty"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("Description must be a string")
    .trim(),

  body("capacity")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Capacity must be a positive integer"),

  body("image")
    .optional({ nullable: true })
    .isString()
    .withMessage("Image must be a string")
    .trim(),

  body("status")
    .optional()
    .isIn(["available", "unavailable"])
    .withMessage("Invalid status"),
];

export const getAllResourcesValidation = [
  query("status")
    .optional()
    .isIn(["available", "unavailable"])
    .withMessage("Invalid status"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Limit must be a positive integer"),
];

export const createBookingValidation = [
  body("resource")
    .notEmpty()
    .withMessage("Resource is required")
    .isMongoId()
    .withMessage("Invalid resource ID"),

  body("course")
    .notEmpty()
    .withMessage("Course is required")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Course must be between 3 and 100 characters"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),

  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date must be in YYYY-MM-DD format")
    .custom((value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) throw new Error("Invalid date");

      // Strip time from both sides for a clean date comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);

      if (date < today) throw new Error("Booking date cannot be in the past");
      return true;
    }),

  body("startTime")
    .notEmpty()
    .withMessage("Start time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Start time must be in HH:MM format"),

  body("endTime")
    .notEmpty()
    .withMessage("End time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("End time must be in HH:MM format")
    .custom((value, { req }) => {
      const start = req.body.startTime;
      if (!start) return true; // startTime validation will catch this

      if (value <= start) throw new Error("End time must be after start time");
      return true;
    }),
];

export const updateBookingValidation = [
  param("id")
    .notEmpty()
    .withMessage("Booking ID is required")
    .isMongoId()
    .withMessage("Invalid Booking ID"),

  body("course")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Course must be between 3 and 100 characters"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes must not exceed 500 characters"),

  body("date")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date must be in YYYY-MM-DD format")
    .custom((value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) throw new Error("Invalid date");

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);

      if (date < today) throw new Error("Booking date cannot be in the past");
      return true;
    }),

  body("startTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Start time must be in HH:MM format"),

  body("endTime")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("End time must be in HH:MM format")
    .custom((value, { req }) => {
      const start = req.body.startTime;
      if (!start) return true;

      if (value <= start) throw new Error("End time must be after start time");
      return true;
    }),

  body("attendance")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Attendance must be a positive number"),
];

export const cancelBookingValidation = [
  param("id")
    .notEmpty()
    .withMessage("Booking ID is required")
    .isMongoId()
    .withMessage("Invalid Booking ID"),
];

export const getBookingsValidation = [
  query("status")
    .optional()
    .isIn(["confirmed", "cancelled", "completed"])
    .withMessage("Invalid status"),
  query("resource").optional().isMongoId().withMessage("Invalid resource ID"),
  query("user").optional().isMongoId().withMessage("Invalid user ID"),
  query("date")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date must be in YYYY-MM-DD format"),
  query("department")
    .optional()
    .isIn(["computer science", "cyber security", "information system"])
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

export const uploadMaterialValidation = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),

  body("course")
    .notEmpty()
    .withMessage("Course is required")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Course must be between 2 and 100 characters"),

  body("department")
    .notEmpty()
    .withMessage("Department is required")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Department must be between 2 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),

  body("uploadedBy")
    .notEmpty()
    .withMessage("Uploaded by is required")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage("Name can only contain letters, spaces, and . ' -"),

  body("fileUrl")
    .notEmpty()
    .withMessage("File URL is required")
    .isURL()
    .withMessage("File URL must be a valid URL"),

  body("fileName")
    .notEmpty()
    .withMessage("File name is required")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("File name must not exceed 255 characters"),

  body("fileSize")
    .notEmpty()
    .withMessage("File size is required")
    .isNumeric()
    .withMessage("File size must be a number")
    .custom((value) => {
      if (value <= 0) throw new Error("File size must be greater than 0");
      if (value > 50 * 1024 * 1024)
        throw new Error("File size must not exceed 50MB");
      return true;
    }),

  body("fileType")
    .notEmpty()
    .withMessage("File type is required")
    .isIn(["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"])
    .withMessage("Invalid file type"),
];

export const downloadFileValidation = [
  query("fileUrl")
    .notEmpty()
    .withMessage("fileUrl is required")
    .isURL()
    .withMessage("fileUrl must be a valid URL"),
  query("fileName")
    .notEmpty()
    .withMessage("fileName is required")
    .isString()
    .withMessage("fileName must be a string")
    .trim(),
];
