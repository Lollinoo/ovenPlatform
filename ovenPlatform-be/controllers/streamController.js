import omeService from "../services/omeService.js";
import base64url from "base64url";
import crypto from "crypto";
import config from "../config.js";
import { validateStreamName } from "../utils/validators.js";
import axios from "axios";
import streamService from "../services/streamService.js";
import { User } from "../schemas/user.model.js";
import { Stream } from "../schemas/stream.model.js";

// Axios configuration for OvenMediaEngine (copied from omeService.js for direct API calls)
const omeAxios = axios.create({
  baseURL: `${config.ome.protocol}://${config.ome.host}:${config.ome.port}`,
  auth: config.ome.auth,
  timeout: config.ome.requestTimeout,
});

class StreamController {
  /**
   * Gets all active streams with their statistics.
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getAllActiveStreamsWithStats(req, res) {
    try {
      const data = await omeService.getAllActiveStreamsWithStats();
      res.json(data);
    } catch (error) {
      // omeService now handles more detailed logging of OME API errors.
      // Here, we focus on sending a consistent error response to the client.
      console.error(
        "Error in StreamController.getAllActiveStreamsWithStats:",
        error.message
      );
      const statusCode = error.response?.status || 500;
      const responseMessage = error.isAxiosError
        ? error.response?.data?.message || error.message
        : "Internal server error";
      res.status(statusCode).json({ message: responseMessage });
    }
  }

  /**
   * Generates a signed URL for a stream.
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async generateSignedUrl(req, res) {
    try {
      const { streamName } = req.body;

      // Basic presence check
      if (
        !streamName ||
        typeof streamName !== "string" ||
        streamName.trim() === ""
      ) {
        return res.status(400).json({
          code: "MISSING_STREAM_NAME",
          message:
            "'streamName' is required in the request body and must be a non-empty string.",
        });
      }

      // Comprehensive validation with specific rules
      const validation = validateStreamName(streamName);
      if (!validation.isValid) {
        return res.status(validation.error.status).json({
          code: validation.error.code,
          message: validation.error.message,
        });
      }

      // Check if the stream name is already in use
      try {
        const isStreamInUse = await omeService.isStreamNameInUse(
          streamName.trim()
        );
        if (isStreamInUse) {
          return res.status(409).json({
            // 409 Conflict - indicating a resource conflict
            code: "STREAM_NAME_ALREADY_IN_USE",
            message: `Stream name "${streamName}" is already in use. Please choose a different name.`,
          });
        }
      } catch (error) {
        console.error("Error checking stream name uniqueness:", error.message);
        // If we can't determine if the stream is in use, we have two options:
        // 1. Proceed anyway (less safe, might allow duplicates)
        // 2. Reject with an error (safer, prevents potential duplicates)
        return res.status(503).json({
          code: "SERVICE_UNAVAILABLE",
          message:
            "Unable to verify stream name uniqueness. Please try again later.",
        });
      }

      const HMAC_KEY = config.ome.SignedPolicySecretKey;
      if (!HMAC_KEY) {
        console.error(
          "SignedPolicySecretKey is not configured. Cannot generate signed URL."
        );
        return res.status(500).json({
          code: "SERVER_CONFIG_ERROR",
          message: "Server configuration error",
        });
      }

      // Ensure this template matches your OME configuration
      const BASE_URL_TEMPLATE = `rtmp://${config.ome.host}:${config.ome.rtmpPort}/${config.ome.appName}/`;
      const SIGNATURE_QUERY_KEY_NAME = "signature";
      const POLICY_QUERY_KEY_NAME = "policy";

      const baseUrl = `${BASE_URL_TEMPLATE}${streamName.trim()}`;

      // Create a policy with an expiration (e.g., 3 minutes from now)
      const expiresInSeconds = 3 * 60; // 3 minutes
      const expirationTimestamp = Date.now() + expiresInSeconds * 1000; // Use milliseconds for Date.now()
      const policy = JSON.stringify({ url_expire: expirationTimestamp });

      const policyBase64 = base64url(Buffer.from(policy, "utf8"));

      const qsSeparator = baseUrl.includes("?") ? "&" : "?";
      let policyUrl =
        baseUrl + qsSeparator + POLICY_QUERY_KEY_NAME + "=" + policyBase64;

      // If the original baseUrl already had parameters, ensure policyUrl includes them correctly.
      // This simple implementation assumes baseUrl doesn't have pre-existing parameters when using '?'
      // or that parameters are correctly appended when using '&'.
      // For more complex scenarios, more robust query parameter handling might be needed.

      const signature = base64url(
        crypto.createHmac("sha1", HMAC_KEY).update(policyUrl).digest()
      );

      const signedUrl =
        policyUrl + "&" + SIGNATURE_QUERY_KEY_NAME + "=" + signature;

      res.json({
        signedUrl,
        expiresAt: new Date(expirationTimestamp).toISOString(), // Include expiration time for frontend
      });
    } catch (error) {
      console.error("Error generating signed URL:", error);
      res.status(500).json({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Internal server error",
      });
    }
  }

  /**
   * Gets a list of all active streams directly from the OME API.
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getAllActiveStreams(req, res) {
    try {
      const activeStreamNames = await omeService.getActiveStreamNames();
      res.json(activeStreamNames);
    } catch (error) {
      console.error(
        "Error in StreamController.getAllActiveStreams:",
        error.message
      );
      const statusCode = error.response?.status || 500;
      const responseMessage = error.isAxiosError
        ? error.response?.data?.message || error.message
        : "Internal server error";
      res.status(statusCode).json({
        code: "FETCH_STREAMS_ERROR",
        message: responseMessage,
      });
    }
  }

  /**
   * Gets detailed information for a specific stream from the OME API.
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getStreamInfo(req, res) {
    try {
      const { streamName } = req.params;

      // Basic presence check
      if (
        !streamName ||
        typeof streamName !== "string" ||
        streamName.trim() === ""
      ) {
        return res.status(400).json({
          code: "MISSING_STREAM_NAME",
          message:
            "'streamName' URL parameter is required and must be a non-empty string.",
        });
      }

      // Comprehensive validation with specific rules
      const validation = validateStreamName(streamName);
      if (!validation.isValid) {
        return res.status(validation.error.status).json({
          code: validation.error.code,
          message: validation.error.message,
        });
      }

      try {
        // Make a direct call to the OME API to get stream information
        const streamInfo = await omeAxios.get(
          `/v1/stats/current/vhosts/${config.ome.vhostName}/apps/${config.ome.appName}/streams/${streamName.trim()}`
        );

        res.json(
          {
            createdTime: streamInfo.data.response.createdTime,
            totalConnections: streamInfo.data.response.totalConnections,
          } || {}
        );
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return res.status(404).json({
            code: "STREAM_NOT_FOUND",
            message: `Stream with name "${streamName}" not found.`,
          });
        }
        throw error; // Pass other errors to the catch block below
      }
    } catch (error) {
      console.error(
        `Error in StreamController.getStreamInfo for ${req.params.streamName}:`,
        error.message
      );
      const statusCode = error.response?.status || 500;
      const responseMessage = error.isAxiosError
        ? error.response?.data?.message || error.message
        : "Internal server error";
      res.status(statusCode).json({
        code: "FETCH_STREAM_INFO_ERROR",
        message: responseMessage,
      });
    }
  }
  /**
   * Gets the thumbnail for a specific stream.
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getStreamThumbnail(req, res) {
    try {
      const { streamName } = req.params;

      // Basic presence check
      if (
        !streamName ||
        typeof streamName !== "string" ||
        streamName.trim() === ""
      ) {
        return res.status(400).json({
          code: "MISSING_STREAM_NAME",
          message:
            "'streamName' URL parameter is required and must be a non-empty string.",
        });
      }

      // Comprehensive validation with specific rules
      const validation = validateStreamName(streamName);
      if (!validation.isValid) {
        return res.status(validation.error.status).json({
          code: validation.error.code,
          message: validation.error.message,
        });
      }

      // Check if thumbnail service is configured before attempting to use it
      if (!config.ome.thumbnailHost || isNaN(config.ome.thumbnailPort)) {
        console.error(
          "StreamController: OME Thumbnail host or port is not configured."
        );
        return res.status(503).json({
          code: "SERVICE_UNAVAILABLE",
          message: "Thumbnail service is not available or not configured.",
        });
      }

      const thumbnailData = await omeService.getStreamThumbnail(
        streamName.trim()
      );

      // Set the correct content type for the image
      res.header("Content-Type", "image/jpeg");
      res.send(thumbnailData);
    } catch (error) {
      console.error(
        `Error in StreamController.getStreamThumbnail for ${req.params.streamName}:`,
        error.message
      );
      let statusCode = 500;
      let responseCode = "INTERNAL_SERVER_ERROR";
      let responseMessage = "Error fetching stream thumbnail.";

      if (error.message === "Thumbnail service is not configured.") {
        statusCode = 503;
        responseCode = "SERVICE_UNAVAILABLE";
        responseMessage =
          "Thumbnail service is not available or not configured.";
      } else if (error.isAxiosError) {
        statusCode = error.response?.status || 502; // Bad Gateway if OME thumbnail endpoint is down/errors
        responseCode = "EXTERNAL_SERVICE_ERROR";
        // Try to provide a more specific message if available from the error response
        if (statusCode === 404) {
          responseCode = "THUMBNAIL_NOT_FOUND";
          responseMessage = "Thumbnail not found for the specified stream.";
        } else {
          responseMessage =
            error.response?.data?.message ||
            error.response?.statusText ||
            "Error communicating with thumbnail service.";
        }
      } else if (error.code === "ECONNREFUSED") {
        statusCode = 503; // Service Unavailable
        responseCode = "SERVICE_UNAVAILABLE";
        responseMessage = "Thumbnail service is currently unavailable.";
      }

      res.status(statusCode).json({
        code: responseCode,
        message: responseMessage,
      });
    }
  }
  /**



   * Gets statistics for a specific stream.


   * @param {Object} req - Request object


   * @param {Object} res - Response object


   */
  /**
   * Gets statistics for a specific stream.
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getStreamStats(req, res) {
    try {
      const { streamName } = req.params;

      // Basic presence check
      if (
        !streamName ||
        typeof streamName !== "string" ||
        streamName.trim() === ""
      ) {
        return res.status(400).json({
          code: "MISSING_STREAM_NAME",
          message:
            "'streamName' URL parameter is required and must be a non-empty string.",
        });
      }

      // Comprehensive validation with specific rules
      const validation = validateStreamName(streamName);
      if (!validation.isValid) {
        return res.status(validation.error.status).json({
          code: validation.error.code,
          message: validation.error.message,
        });
      }

      try {
        const streamStats = await omeService.getStreamStats(streamName.trim());
        res.json(streamStats);
      } catch (error) {
        if (error.message && error.message.includes("not found")) {
          return res.status(404).json({
            code: "STREAM_NOT_FOUND",
            message: `Stream with name "${streamName}" not found.`,
          });
        }
        throw error; // Pass other errors to the catch block below
      }
    } catch (error) {
      console.error("Error in StreamController.getStreamStats:", error.message);
      const statusCode = error.response?.status || 500;
      const responseMessage = error.isAxiosError
        ? error.response?.data?.message || error.message
        : error.message || "Internal server error";

      res.status(statusCode).json({
        code: "FETCH_STREAM_STATS_ERROR",
        message: responseMessage,
      });
    }
  }
  /**
   * Ottiene tutti gli stream registrati nel database
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getRegisteredStreams(req, res) {
    try {
      // Solo gli amministratori possono vedere tutte le stream registrate
      const adminRole = req.user?.role === "admin";

      if (!adminRole) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: Admin privileges required",
        });
      }

      const streams = await Stream.find().populate(
        "userId",
        "username email isVerified"
      );

      res.status(200).json({
        success: true,
        streams,
      });
    } catch (error) {
      console.error("Error fetching registered streams:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while fetching registered streams",
      });
    }
  }

  /**
   * Gets the status of a specific stream by username
   */
  async getStreamStatus(req, res) {
    try {
      const { username } = req.params;

      // Check if the username exists and stream is active in our database
      const streamRecord = await Stream.findOne({ username });

      if (!streamRecord) {
        return res.status(404).json({
          success: false,
          message: "Stream not found",
        });
      }

      // Check if the stream is active in OME
      let isActuallyActive = false;
      try {
        const activeStreams = await omeService.getActiveStreamNames();
        isActuallyActive = activeStreams.includes(username);

        // If database says stream is active but OME says it's inactive,
        // update the database record
        if (streamRecord.isActive && !isActuallyActive) {
          await streamService.deactivateStream(username);
          streamRecord.isActive = false;
        }
      } catch (err) {
        console.error("Error checking stream status in OME:", err);
      }

      res.json({
        success: true,
        data: {
          username,
          isActive: streamRecord.isActive && isActuallyActive,
          lastStreamStartedAt: streamRecord.lastStreamStartedAt,
          lastStreamEndedAt: streamRecord.lastStreamEndedAt,
          streamSessionId: streamRecord.streamSessionId,
        },
      });
    } catch (error) {
      console.error("Error in getStreamStatus:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Gets all streams with their database details
   */
  async getAllStreamsWithDetails(req, res) {
    try {
      // Get all streams from database
      const streams = await Stream.find({});

      res.json(streams);
    } catch (error) {
      console.error("Error in getAllStreamsWithDetails:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Gets stream information for the current authenticated user
   */
  async getUserStream(req, res) {
    try {
      const userId = req.user._id;

      // Find the user's stream in the database
      const streamRecord = await Stream.findOne({ userId });

      if (!streamRecord) {
        return res.json({
          success: true,
          data: null,
        });
      }

      // If stream is marked as active, verify with OME that it really is
      if (streamRecord.isActive) {
        try {
          const activeStreams = await omeService.getActiveStreamNames();

          // If not actually active in OME, update our database
          if (!activeStreams.includes(streamRecord.username)) {
            await streamService.deactivateStream(streamRecord.username);
            streamRecord.isActive = false;
            streamRecord.streamSessionId = null;
          }
        } catch (err) {
          console.error("Error verifying stream active status with OME:", err);
        }
      }

      res.json({
        success: true,
        data: streamRecord,
      });
    } catch (error) {
      console.error("Error in getUserStream:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Termina uno stream attivo
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async terminateStream(req, res) {
    try {
      const { streamId } = req.params;
      const userId = req.user._id;

      // Find the stream record
      const streamRecord = await Stream.findOne({
        streamSessionId: streamId,
        userId,
      });

      if (!streamRecord) {
        return res.status(404).json({
          success: false,
          message:
            "Stream not found or you don't have permission to terminate it",
        });
      }

      if (!streamRecord.isActive) {
        return res.status(400).json({
          success: false,
          message: "Stream is not active",
        });
      }

      // Terminate the stream through OME
      await omeService.terminateStream(streamRecord.username);

      // Update the stream record
      await streamService.deactivateStream(streamRecord.username);

      res.json({
        success: true,
        message: "Stream terminated successfully",
      });
    } catch (error) {
      console.error("Error in terminateStream:", error);
      res.status(500).json({
        success: false,
        message: "Failed to terminate stream",
      });
    }
  }

  /**
   * Ottiene tutte le informazioni sugli stream attivi combinando OME e il DB
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getActiveStreamsDetails(req, res) {
    try {
      // Ottieni stream attivi dal nostro database
      const dbActiveStreams = await streamService.getActiveStreams();

      // Ottieni stream attivi da OME
      const omeActiveStreams = await omeService.getAllActiveStreamsWithStats();

      // Combina le informazioni
      const combinedStreams = dbActiveStreams.map((dbStream) => {
        const omeStream = omeActiveStreams.find(
          (ome) => ome.streamName === dbStream.username
        );

        return {
          ...dbStream._doc,
          omeStats: omeStream || null,
        };
      });

      res.status(200).json({
        success: true,
        streams: combinedStreams,
      });
    } catch (error) {
      console.error("Error fetching combined active streams:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while fetching active streams details",
      });
    }
  }

  /**
   * Ottiene tutte le statistiche degli stream registrati
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getAllStreamsStats(req, res) {
    try {
      // Ottieni tutti gli stream registrati
      const allStreams = await Stream.find();

      // Ottieni gli stream attivi da OME con le statistiche
      const omeActiveStreamsWithStats =
        await omeService.getAllActiveStreamsWithStats();

      // Mappa delle statistiche per username
      const statsMap = new Map();
      omeActiveStreamsWithStats.forEach((stream) => {
        statsMap.set(stream.streamName, stream);
      });

      // Combina le informazioni
      const streamsWithStats = allStreams.map((stream) => {
        const omeStats = statsMap.get(stream.username) || null;

        return {
          id: stream._id,
          username: stream.username,
          isActive: stream.isActive,
          lastStreamStartedAt: stream.lastStreamStartedAt,
          lastStreamEndedAt: stream.lastStreamEndedAt,
          viewers: stream.viewers,
          videoBitrate: stream.videoBitrate,
          videoResolution: stream.videoResolution,
          lastUpdatedAt: stream.lastUpdatedAt,
          omeStats: omeStats,
        };
      });

      res.status(200).json({
        success: true,
        count: streamsWithStats.length,
        activeCount: omeActiveStreamsWithStats.length,
        streams: streamsWithStats,
      });
    } catch (error) {
      console.error("Error fetching all streams stats:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while fetching all streams stats",
      });
    }
  }
}

export default new StreamController();
