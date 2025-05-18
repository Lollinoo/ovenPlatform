import bcrypt from "bcryptjs";
import { User } from "../schemas/user.model.js";
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
} from "../utils/validators.js";
import {
  sendVerificationEmail,
  sendEmailChangeConfirmation,
  sendUsernameChangeConfirmation,
} from "../services/emailService.js";
import crypto from "crypto";
import generateLongLivedRtmpUrl from "../utils/rtmpUrlGenerator.js";
import streamService from "../services/streamService.js";

// Costante per i giorni minimi tra cambi (30 giorni)
const MIN_DAYS_BETWEEN_CHANGES = 30;

/**
 * Verifica se è passato abbastanza tempo dall'ultima modifica
 * @param {Date|null} lastChangeDate - Data dell'ultima modifica
 * @returns {boolean} - True se è possibile effettuare una modifica, False se troppo recente
 */
const isChangeAllowed = (lastChangeDate) => {
  if (!lastChangeDate) return true;

  const now = new Date();
  const timeDiff = now.getTime() - new Date(lastChangeDate).getTime();
  const daysDiff = timeDiff / (1000 * 3600 * 24);

  return daysDiff >= MIN_DAYS_BETWEEN_CHANGES;
};

/**
 * Calcola la data in cui sarà nuovamente possibile effettuare una modifica
 * @param {Date} lastChangeDate - Data dell'ultima modifica
 * @returns {Date} - Data in cui sarà possibile effettuare una modifica
 */
const getNextAllowedChangeDate = (lastChangeDate) => {
  if (!lastChangeDate) return new Date();

  const nextDate = new Date(lastChangeDate);
  nextDate.setDate(nextDate.getDate() + MIN_DAYS_BETWEEN_CHANGES);
  return nextDate;
};

/**
 * Profile management controller
 * Handles operations for user profile management
 */
class ProfileController {
  /**
   * Update user's username
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async updateUsername(req, res) {
    try {
      const userId = req.user.id;
      const { username, password } = req.body;

      // Validate inputs
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username and current password are required",
        });
      }

      if (!isValidUsername(username)) {
        return res.status(400).json({
          success: false,
          message:
            "Username must be 3-30 characters long with only letters, numbers and underscores",
        });
      }

      // Get user from database
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Check monthly limit for username changes
      if (user.lastUsernameChangeAt) {
        if (!isChangeAllowed(user.lastUsernameChangeAt)) {
          const nextAllowedDate = getNextAllowedChangeDate(
            user.lastUsernameChangeAt
          );
          return res.status(429).json({
            success: false,
            message: "Username can only be changed once every 30 days",
            nextAllowedDate: nextAllowedDate,
          });
        }
      }

      // Check if username is already taken (except by current user)
      const existingUser = await User.findOne({
        username,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "This username is already taken",
        });
      }

      // Create verification token for username change
      const usernameChangeToken = crypto.randomBytes(32).toString("hex");
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store new username and token in user document
      user.pendingUsername = username;
      user.usernameChangeToken = usernameChangeToken;
      user.usernameChangeTokenExpiresAt = tokenExpiry;
      await user.save();

      // Send verification email to user's current email address
      await sendUsernameChangeConfirmation(
        user.email,
        usernameChangeToken,
        username
      );

      res.status(200).json({
        success: true,
        message:
          "A verification email has been sent to confirm your username change",
      });
    } catch (error) {
      console.error("Error initiating username update:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while processing your request",
      });
    }
  }

  /**
   * Complete username update process
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async confirmUsernameUpdate(req, res) {
    try {
      const { token } = req.body;

      const user = await User.findOne({
        usernameChangeToken: token,
        usernameChangeTokenExpiresAt: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired token",
        });
      }

      // Aggiorna lo username utente
      const oldUsername = user.username;
      const newUsername = user.pendingUsername;
      user.username = newUsername;
      user.pendingUsername = undefined;
      user.usernameChangeToken = undefined;
      user.usernameChangeTokenExpiresAt = undefined;
      user.lastUsernameChangeAt = new Date();

      // Genera anche un nuovo RTMP URL basato sul nuovo username
      try {
        const { signedUrl, expiresAt } =
          await generateLongLivedRtmpUrl(newUsername);
        user.rtmpUrl = signedUrl;
        user.rtmpUrlExpiresAt = expiresAt;
        user.lastRtmpRegeneratedAt = new Date(); // Aggiorna anche la data di rigenerazione RTMP

        // Aggiorna anche il record nella tabella Stream
        await streamService.createOrUpdateStream(
          user._id,
          newUsername,
          signedUrl,
          expiresAt
        );
      } catch (rtmpError) {
        console.error(
          "Error generating RTMP URL during username change:",
          rtmpError
        );
        // Continuiamo comunque anche se la generazione RTMP fallisce
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: "Username updated successfully and new RTMP URL generated",
        rtmpUrl: user.rtmpUrl,
        rtmpUrlExpiresAt: user.rtmpUrlExpiresAt,
      });
    } catch (error) {
      console.error("Error confirming username update:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while updating username",
      });
    }
  }

  /**
   * Initiate email update process
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async updateEmail(req, res) {
    try {
      const userId = req.user.id;
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and current password are required",
        });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Check if email is already used
      const existingEmail = await User.findOne({
        email,
        _id: { $ne: userId },
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "This email is already in use",
        });
      }

      // Create verification token for email change
      const emailChangeToken = crypto.randomBytes(32).toString("hex");
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store new email and token in user document
      user.pendingEmail = email;
      user.emailChangeToken = emailChangeToken;
      user.emailChangeTokenExpiresAt = tokenExpiry;
      await user.save();

      // Send verification email to new address
      await sendEmailChangeConfirmation(email, emailChangeToken);

      res.status(200).json({
        success: true,
        message: "A verification email has been sent to your new email address",
      });
    } catch (error) {
      console.error("Error initiating email update:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while processing your request",
      });
    }
  }

  /**
   * Complete email update process
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async confirmEmailUpdate(req, res) {
    try {
      const { token } = req.body;

      const user = await User.findOne({
        emailChangeToken: token,
        emailChangeTokenExpiresAt: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired token",
        });
      }

      // Update email
      user.email = user.pendingEmail;
      user.pendingEmail = undefined;
      user.emailChangeToken = undefined;
      user.emailChangeTokenExpiresAt = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Email address updated successfully",
      });
    } catch (error) {
      console.error("Error confirming email update:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while updating email",
      });
    }
  }

  /**
   * Change user's password
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password and new password are required",
        });
      }

      if (!isValidPassword(newPassword)) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 8 characters long and include uppercase, lowercase, number and special character (!@#$%&)",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      user.password = hashedPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while changing password",
      });
    }
  }

  /**
   * Regenerate RTMP URL for user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async regenerateRtmpUrl(req, res) {
    try {
      const userId = req.user.id;

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
          message: "Email verification required before generating RTMP URL",
        });
      }

      // Check monthly limit for RTMP URL regeneration
      if (user.lastRtmpRegeneratedAt) {
        if (!isChangeAllowed(user.lastRtmpRegeneratedAt)) {
          const nextAllowedDate = getNextAllowedChangeDate(
            user.lastRtmpRegeneratedAt
          );
          return res.status(429).json({
            success: false,
            message: "RTMP URL can only be regenerated once every 30 days",
            nextAllowedDate: nextAllowedDate,
          });
        }
      }

      // Generate new RTMP URL
      const { signedUrl, expiresAt } = await generateLongLivedRtmpUrl(
        user.username
      );

      // Update user with new URL and record the regeneration date
      user.rtmpUrl = signedUrl;
      user.rtmpUrlExpiresAt = expiresAt;
      user.lastRtmpRegeneratedAt = new Date();
      await user.save();

      // Aggiorna anche il record nella tabella Stream
      await streamService.createOrUpdateStream(
        user._id,
        user.username,
        signedUrl,
        expiresAt
      );

      res.status(200).json({
        success: true,
        message: "RTMP URL regenerated successfully",
        rtmpUrl: signedUrl,
        rtmpUrlExpiresAt: expiresAt,
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

export default new ProfileController();
