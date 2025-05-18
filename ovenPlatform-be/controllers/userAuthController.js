import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import base64url from "base64url";
import { User } from "../schemas/user.model.js";
import config from "../config.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../services/emailService.js";
import generateLongLivedRtmpUrl from "../utils/rtmpUrlGenerator.js";
import {
  validateUserInput,
  isValidEmail,
  isValidPassword,
  isValidUsername,
} from "../utils/validators.js";

// La funzione generateLongLivedRtmpUrl è stata spostata in rtmpUrlGenerator.js

/**
 * User Authentication Controller
 * Handles all user authentication related operations
 */
class UserAuthController {
  /**
   * Register a new user
   * @param {Object} req - Request object containing user registration data
   * @param {Object} res - Response object
   */
  async signup(req, res) {
    try {
      const { email, password, username } = req.body;

      // Validate input
      const validation = validateUserInput({ email, password, username });
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      // Check if user with email already exists
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      // Check if username is taken
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: "This username is already taken",
        });
      }

      // Create verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExpiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ); // 24 hours

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const newUser = new User({
        email,
        password: hashedPassword,
        username,
        verificationToken,
        verificationTokenExpiresAt,
      });

      await newUser.save();

      // Send verification email
      await sendVerificationEmail(email, verificationToken);

      res.status(201).json({
        success: true,
        message:
          "User registered successfully. Please check your email to verify your account.",
      });
    } catch (error) {
      console.error("Error in signup:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred during registration",
      });
    }
  }

  /**
   * Login user and issue access token
   * @param {Object} req - Request object containing login credentials
   * @param {Object} res - Response object
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Check if user is verified
      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: "Please verify your email before logging in",
        });
      }

      // Validate password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Update last login
      user.lastLogin = Date.now();
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, email: user.email },
        config.auth.jwtSecret,
        { expiresIn: config.auth.jwtExpiresIn }
      );

      // Set token in HTTP-only cookie
      res.cookie("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: "strict",
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Error in login:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred during login",
      });
    }
  }

  /**
   * Logout user by clearing the auth cookie
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async logout(req, res) {
    try {
      res.clearCookie("authToken");
      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Error in logout:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred during logout",
      });
    }
  }

  /**
   * Verify user email using token
   * @param {Object} req - Request object containing verification token
   * @param {Object} res - Response object
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpiresAt: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification token",
        });
      }

      // Generate a long-lived RTMP URL using the username as streamName
      try {
        const { signedUrl, expiresAt } = await generateLongLivedRtmpUrl(
          user.username
        );

        // Update user with RTMP URL and other verification details
        user.rtmpUrl = signedUrl;
        user.rtmpUrlExpiresAt = expiresAt;
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;

        await user.save();

        res.status(200).json({
          success: true,
          message: "Email verified successfully. You can now login.",
          rtmpUrl: signedUrl,
          rtmpUrlExpiresAt: expiresAt,
        });
      } catch (error) {
        console.error("Error generating RTMP URL:", error);

        // Even if RTMP URL generation fails, still verify the user
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;

        await user.save();

        res.status(200).json({
          success: true,
          message:
            "Email verified successfully, but RTMP URL generation failed. You can now login.",
        });
      }
    } catch (error) {
      console.error("Error in verifyEmail:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred during email verification",
      });
    }
  }

  /**
   * Generate a password reset token and send it via email
   * @param {Object} req - Request object containing user email
   * @param {Object} res - Response object
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        // For security reasons, don't reveal if the email exists or not
        return res.status(200).json({
          success: true,
          message:
            "If a user with that email exists, a password reset link has been sent.",
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save token to user
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiresAt = resetTokenExpiresAt;
      await user.save();

      // Send password reset email
      await sendPasswordResetEmail(email, resetToken);

      res.status(200).json({
        success: true,
        message:
          "If a user with that email exists, a password reset link has been sent.",
      });
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred during password reset request",
      });
    }
  }

  /**
   * Reset user password using reset token
   * @param {Object} req - Request object containing new password and token
   * @param {Object} res - Response object
   */
  async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password } = req.body;

      // Validate password
      if (!isValidPassword(password)) {
        return res.status(422).json({
          success: false,
          message:
            "Password must be at least 8 characters long and include uppercase, lowercase, number and special character (!@#$%&)",
        });
      }

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpiresAt: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired password reset token",
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update user password
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiresAt = undefined;

      await user.save();

      res.status(200).json({
        success: true,
        message:
          "Password has been reset successfully. You can now login with your new password.",
      });
    } catch (error) {
      console.error("Error in resetPassword:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred during password reset",
      });
    }
  }

  /**
   * Get current authenticated user's data
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getCurrentUser(req, res) {
    try {
      // Get the token from cookie
      const token = req.cookies.authToken;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      // Verify token
      const decoded = jwt.verify(token, config.auth.jwtSecret);

      // Get user from database
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Return user data including RTMP URL information
      res.status(200).json({
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
        rtmpUrl: user.rtmpUrl,
        rtmpUrlExpiresAt: user.rtmpUrlExpiresAt,
      });
    } catch (error) {
      console.error("Error getting current user:", error);
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }
  }

  /**
   * Generate signed URL for RTMP streaming
   * @param {Object} req - Request object containing stream key
   * @param {Object} res - Response object
   */
  async generateRtmpSignedUrl(req, res) {
    try {
      const { streamKey } = req.body;

      // Validate stream key
      if (!streamKey) {
        return res.status(400).json({
          success: false,
          message: "Stream key is required",
        });
      }

      // Find user by stream key
      const user = await User.findOne({ "streaming.streamKey": streamKey });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Generate signed URL
      const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour
      const signature = base64url.encode(
        crypto
          .createHmac("sha256", config.rtmp.secret)
          .update(`${streamKey}:${expiry}`)
          .digest("hex")
      );

      const signedUrl = `rtmp://${config.rtmp.host}/${config.rtmp.app}/${streamKey}?token=${signature}&expires=${expiry}`;

      res.status(200).json({
        success: true,
        url: signedUrl,
      });
    } catch (error) {
      console.error("Error generating RTMP signed URL:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while generating RTMP signed URL",
      });
    }
  }

  // La funzione generateLongLivedRtmpUrl è stata spostata fuori dalla classe

  /**
   * Regenerate a user's RTMP URL
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async regenerateRtmpUrl(req, res) {
    try {
      // Get user from request (set by authMiddleware)
      const userId = req.user.id;

      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if user is verified
      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: "User must verify email before getting an RTMP URL",
        });
      }

      // Generate a new long-lived RTMP URL
      const { signedUrl, expiresAt } = await generateLongLivedRtmpUrl(
        user.username
      );

      // Update user with new RTMP URL
      user.rtmpUrl = signedUrl;
      user.rtmpUrlExpiresAt = expiresAt;
      await user.save();

      // Return the new RTMP URL
      res.status(200).json({
        success: true,
        rtmpUrl: signedUrl,
        rtmpUrlExpiresAt: expiresAt,
        message: "RTMP URL regenerated successfully",
      });
    } catch (error) {
      console.error("Error regenerating RTMP URL:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while regenerating RTMP URL",
      });
    }
  }
}

export default new UserAuthController();
