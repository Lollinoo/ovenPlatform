import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import config from "./config.js";
import enableCors from "./middleware/cors.js";
import errorHandler from "./middleware/errorHandler.js";
import streamRoutes from "./routes/streamRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userAuthRoutes from "./routes/userAuthRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import monitoringRoutes from "./routes/monitoringRoutes.js";

const app = express();
const PORT = config.NodePort;
const NODE_ENV = config.NodeEnv;

// Connect to MongoDB
mongoose
  .connect(config.mongodb.fullUri)
  .then(() => {
    console.log(
      `MongoDB Connected successfully to database: ${config.mongodb.dbName}`
    );
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

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
app.use(cookieParser()); // Parse cookies
app.use(enableCors);

// API Routes
app.use("/v1/ome/streams", streamRoutes);
app.use("/v1/ome", authRoutes); // Routes for OvenMediaEngine connection
app.use("/v1/auth", userAuthRoutes); // Routes for user authentication
app.use("/v1/profile", profileRoutes); // Routes for user profile management
app.use("/v1/monitoring", monitoringRoutes); // Routes for stream monitoring management

// Debug endpoint
app.get("/v1/status", (req, res) => {
  res.json({
    status: "ok",
    message: "API server is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening in ${NODE_ENV} on port ${PORT}`);
});
