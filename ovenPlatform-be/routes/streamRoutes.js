const express = require("express");
const router = express.Router();
const streamController = require("../controllers/streamController");

// Routes for stream management
router.get("/", streamController.getAllActiveStreamsWithStats);

// Route to fetch all active streams directly from OME API
router.get("/active", streamController.getAllActiveStreams);

// Route to fetch specific stream information directly from OME API
router.get("/:streamName/info", streamController.getStreamInfo);

// Route to fetch specific stream statistics with detailed data
router.get("/:streamName/stats", streamController.getStreamStats);

// Route to generate a signed URL for a stream
router.post("/generate-signed-url", streamController.generateSignedUrl);

// Route to get a stream thumbnail
router.get("/:streamName/thumb.jpg", streamController.getStreamThumbnail);

module.exports = router;
