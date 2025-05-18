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

// Nuove rotte per la gestione degli stream con il database
router.get("/registered", streamController.getRegisteredStreams);
router.get("/active-details", streamController.getActiveStreamsDetails);
router.get("/details", streamController.getAllStreamsWithDetails);
router.get("/my-stream", streamController.getUserStream);
router.post("/:streamId/terminate", streamController.terminateStream);
router.get("/status/:username", streamController.getStreamStatus);

router.get("/:streamName/info", streamController.getStreamInfo);
// Route to fetch specific stream statistics with detailed data
router.get("/:streamName/stats", streamController.getStreamStats);
// Route to fetch specific stream information directly from OME API
router.get("/:streamName/info", streamController.getStreamInfo);

// Route to fetch specific stream statistics with detailed data
router.get("/:streamName/stats", streamController.getStreamStats);

// Route to generate a signed URL for a stream
router.post("/generate-signed-url", streamController.generateSignedUrl);

// Route to get a stream thumbnail
router.get("/:streamName/thumb.jpg", streamController.getStreamThumbnail);

export default router;
