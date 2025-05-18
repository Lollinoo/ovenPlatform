import express from "express";
import ProfileController from "../controllers/profileController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Routes for user profile management
 * All routes are prefixed with /v1 and require authentication
 */

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Profile update routes
router.post("/update-username", ProfileController.updateUsername);
router.post(
  "/confirm-username-update",
  ProfileController.confirmUsernameUpdate
);
router.post("/update-email", ProfileController.updateEmail);
router.post("/confirm-email-update", ProfileController.confirmEmailUpdate);
router.post("/change-password", ProfileController.changePassword);
router.post("/regenerate-rtmp-url", ProfileController.regenerateRtmpUrl);

export default router;
