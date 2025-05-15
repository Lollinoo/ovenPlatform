import express from "express";
import authController from "../controllers/authController.js";

const router = express.Router();

// Route for OvenMediaEngine admission webhook
// It is crucial that this endpoint can receive the raw request body
// for X-OME-Signature validation, which should be handled by a middleware
// like express.json({ verify: ... }) configured in server.js.
router.post("/admission", authController.handleAdmission);

export default router;
