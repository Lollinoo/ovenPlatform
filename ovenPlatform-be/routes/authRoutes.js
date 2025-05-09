const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Route for OvenMediaEngine admission webhook
// It is crucial that this endpoint can receive the raw request body
// for X-OME-Signature validation, which should be handled by a middleware
// like express.json({ verify: ... }) configured in server.js.
router.post("/admission", authController.handleAdmission);

module.exports = router;
