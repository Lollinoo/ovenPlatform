const express = require("express");
const config = require("./config");
const enableCors = require("./middleware/cors");
const errorHandler = require("./middleware/errorHandler");
const streamRoutes = require("./routes/streamRoutes");
const authRoutes = require("./routes/authRoutes"); // Import new routes

const app = express();
const PORT = config.NodePort;
const NODE_ENV = config.NodeEnv;

// Global middleware
// Modify express.json() to save rawBody, necessary for X-OME-Signature signature validation
app.use(
  express.json({
    verify: (req, res, buf, encoding) => {
      if (buf && buf.length) {
        req.rawBody = buf; // Save the raw buffer
      }
    },
  })
);
app.use(enableCors);

// API Routes
app.use("/api/v1/streams", streamRoutes);
app.use("/auth/v1", authRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening in ${NODE_ENV} on port ${PORT}`);
});
