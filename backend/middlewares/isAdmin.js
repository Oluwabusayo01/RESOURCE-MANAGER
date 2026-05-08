import User from "../models/user.model.js";

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        statusCode: 401,
        success: false,
        message: "Unauthorized: User context missing",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      success: false,
      message: "Server error while verifying admin status.",
    });
  }
};

export default isAdmin;
