import express from "express";
import UserAuthController from "../controllers/userAuthController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Routes for user authentication
 * All routes are prefixed with /v1
 */
router.post("/signup", UserAuthController.signup);
router.post("/login", UserAuthController.login);
router.post("/logout", UserAuthController.logout);
router.post("/verify-email", UserAuthController.verifyEmail);
router.post("/forgot-password", UserAuthController.forgotPassword);
router.post("/reset-password/:token", UserAuthController.resetPassword);
router.get("/profile", UserAuthController.getCurrentUser); // Get current user data
router.post(
  "/regenerate-rtmp-url",
  authMiddleware,
  UserAuthController.regenerateRtmpUrl
);

export default router;
