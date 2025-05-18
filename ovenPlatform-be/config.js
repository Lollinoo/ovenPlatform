import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine .env file path based on NODE_ENV
// For production, use .env
// For development, use .env.development
const envPath = path.resolve(
  __dirname,
  process.env.NODE_ENV === "production" ? "./.env" : "./.env.development"
);
dotenv.config({ path: envPath });

// Fallback to .env.local for development if exists (for local overrides)
if (process.env.NODE_ENV !== "production") {
  const localEnvPath = path.resolve(__dirname, "./.env.local");
  if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath, override: true });
  }
}

const config = {
  NodeEnv: process.env.NODE_ENV || "production",
  NodePort: parseInt(process.env.NODE_PORT, 10) || 3000,
  app: {
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3001", // Default to a common dev frontend port
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
    cookieMaxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    senderEmail: process.env.EMAIL_SENDER || "noreply@ovenplatform.com",
    senderName: process.env.EMAIL_SENDER_NAME || "OvenPlatform Team",
  },
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017",
    dbName: process.env.MONGODB_DB_NAME || "ovenplatform",
    // Construct the full URI with database name if it's not already included in MONGODB_URI
    get fullUri() {
      const mongoUrl = new URL(this.uri);

      // Check if there's already a path/database name in the URI
      if (mongoUrl.pathname === "/" || mongoUrl.pathname === "") {
        // No database name in the URI, add it
        mongoUrl.pathname = `/${this.dbName}`;
        return mongoUrl.toString();
      }

      // If the URI already has a database name, return as is
      return this.uri;
    },
  },
  ome: {
    protocol: process.env.OME_PROTOCOL || "http",
    host: process.env.OME_HOST || "localhost", // Default to localhost
    port: parseInt(process.env.OME_PORT, 10) || 8081,
    rtmpPort: parseInt(process.env.OME_RTMP_PORT, 10) || 1935, // default RTMP port
    auth: {
      username: process.env.OME_AUTH_USERNAME || "admin",
      password: process.env.OME_AUTH_PASSWORD || "admin",
    },
    vhostName: process.env.OME_VHOST_NAME || "default", // Default VHost in OME
    appName: process.env.OME_APP_NAME || "app", // Default App in OME
    apiSecretKey: process.env.OME_API_SECRET_KEY, // For X-OME-Signature
    SignedPolicySecretKey: process.env.SIGNED_POLICY_SECRET_KEY, // For signing policies
    signedUrlExpiresInSeconds:
      parseInt(process.env.SIGNED_URL_EXPIRES_IN_SECONDS, 10) || 180, // Default 3 minutes
    requestTimeout: parseInt(process.env.OME_REQUEST_TIMEOUT, 10) || 5000, // Default 5 seconds for OME API calls
    thumbnailProtocol: process.env.OME_THUMBNAIL_PROTOCOL || "https",
    thumbnailHost: process.env.OME_THUMBNAIL_HOST,
    thumbnailPort: parseInt(process.env.OME_THUMBNAIL_PORT, 10),
    enableStreamMonitoring:
      process.env.OME_ENABLE_STREAM_MONITORING !== "false", // Enabled by default unless explicitly disabled
    monitoringInterval:
      parseInt(process.env.OME_MONITORING_INTERVAL, 10) || 30000, // Default 30 seconds
  },
};

export default config;
