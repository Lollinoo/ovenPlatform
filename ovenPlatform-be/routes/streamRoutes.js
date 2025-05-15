import express from "express";
import streamController from "../controllers/streamController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes with authentication middleware
router.use(authenticate);

// Routes for stream management
router.get("/", streamController.getAllActiveStreamsWithStats);

// Route to fetch all active streams directly from OME API
router.get("/active", streamController.getAllActiveStreams);

router.get("/:streamName/info", streamController.getStreamInfo);
// Route to fetch specific stream statistics with detailed data
router.get("/:streamName/stats", streamController.getStreamStats);

// Route to generate a signed URL for a stream
router.post("/generate-signed-url", streamController.generateSignedUrl);

// Route to get a stream thumbnail
router.get("/:streamName/thumb.jpg", streamController.getStreamThumbnail);

export default router;
