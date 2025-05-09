const express = require("express");
const router = express.Router();
const streamController = require("../controllers/streamController");

// Routes for stream management
router.get("/", streamController.getStreamWithStats);

// Route to generate a signed URL for a stream
router.post("/generate-signed-url", streamController.generateSignedUrl);

// Route to get a stream thumbnail
router.get("/:streamName/thumb.jpg", streamController.getStreamThumbnail);

module.exports = router;
