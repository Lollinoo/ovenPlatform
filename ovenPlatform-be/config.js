const dotenv = require("dotenv");
const path = require("path");

// Determine .env file path based on NODE_ENV
// For production, environment variables might be injected directly or a .env.production file used.
// For development, .env.development is used.
// A general .env can serve as a fallback or for shared variables.
const envPath = path.resolve(__dirname, process.env.NODE_ENV === "production" ? "./.env.production" : "./.env.development");
dotenv.config({ path: envPath });

// Fallback to .env if the specific environment file doesn't exist or for common variables.
// Do not override variables already set by the more specific .env file.
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(__dirname, "./.env"), override: false });
}

const config = {
  NodeEnv: process.env.NODE_ENV || "production",
  NodePort: parseInt(process.env.NODE_PORT, 10) || 3000,
  frontend: {
    url: process.env.FRONTEND_URL || "http://localhost:3001", // Default to a common dev frontend port
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
    appName: process.env.OME_APP_NAME || "app",       // Default App in OME
    apiSecretKey: process.env.OME_API_SECRET_KEY, // For X-OME-Signature 
    SignedPolicySecretKey: process.env.SIGNED_POLICY_SECRET_KEY, // For signing policies 
    signedUrlExpiresInSeconds: parseInt(process.env.SIGNED_URL_EXPIRES_IN_SECONDS, 10) || 180, // Default 3 minutes
    requestTimeout: parseInt(process.env.OME_REQUEST_TIMEOUT, 10) || 5000, // Default 5 seconds for OME API calls
    thumbnailProtocol: process.env.OME_THUMBNAIL_PROTOCOL || "https",
    thumbnailHost: process.env.OME_THUMBNAIL_HOST, 
    thumbnailPort: parseInt(process.env.OME_THUMBNAIL_PORT, 10), 
  },
};
module.exports = config;
