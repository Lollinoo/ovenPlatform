import jwt from "jsonwebtoken";
import config from "../config.js";
import { User } from "../schemas/user.model.js";

/**
 * Authentication middleware
 * Verifies JWT token from the cookie and attaches the user to the request
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.authToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please login.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.auth.jwtSecret);

    // Get user from database
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    console.error("Authentication error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token",
    });
  }
};

export default authenticate;
