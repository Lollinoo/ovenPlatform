import axios from "axios";
import config from "../config.js";
// Axios configuration for OvenMediaEngine
const omeAxios = axios.create({
  baseURL: `${config.ome.protocol}://${config.ome.host}:${config.ome.port}`,
  auth: config.ome.auth,
  timeout: config.ome.requestTimeout, // Added timeout from config
});

class OmeService {
  /**
   * Gets the list of active stream names.
   * @returns {Promise<Array<string>>} Array of active stream names.
   */
  async getActiveStreamNames() {
    try {
      const streamsResponse = await omeAxios.get(
        `/v1/vhosts/${config.ome.vhostName}/apps/${config.ome.appName}/streams`
      );
      // The response might contain { "response": ["stream1", "stream2"], "status": 200 }
      // or { "response": [], "status": 200 } if there are no streams.
      // Ensure that response.data.response is an array, otherwise return an empty array.
      return Array.isArray(streamsResponse?.data?.response)
        ? streamsResponse.data.response
        : [];
    } catch (error) {
      // If the endpoint returns 404 (e.g., if the app doesn't exist),
      // it could be handled here or considered as "no active streams".
      // For now, log the error and return an empty array for robustness.
      console.error("Error fetching active stream names:", error.message);
      if (error.response && error.response.status === 404) {
        console.warn(
          `OME app or vhost not found: /v1/vhosts/${config.ome.vhostName}/apps/${config.ome.appName}/streams`
        );
        return []; // App/vhost not found, so no streams
      }
      // For other errors, we might still want to return an empty array or re-throw
      throw error; // Re-throw for other errors to be caught by controller
    }
  }

  /**
   * Gets the list of active streams with their statistics.
   * @returns {Promise<Array>} Array of streams with statistics.
   */
  async getAllActiveStreamsWithStats() {
    try {
      // 1. Get the list of streams
      const streamsResponse = await this.getActiveStreamNames();

      if (streamsResponse.length === 0) {
        return []; // No active streams
      }

      // 2. For each stream, get the details
      const streamDetailsPromises = streamsResponse.map(async (streamName) => {
        try {
          const statsResponse = await omeAxios.get(
            `/v1/vhosts/${config.ome.vhostName}/apps/${config.ome.appName}/streams/${streamName}`
          );
          const liveStatsResponse = await omeAxios.get(
            `/v1/stats/current/vhosts/${config.ome.vhostName}/apps/${config.ome.appName}/streams/${streamName}`
          );

          // Extract base response data
          const statsResponseData = statsResponse?.data?.response || {};
          const liveStatsResponseData = liveStatsResponse?.data?.response || {};

          // Extract video information from input.tracks if available
          let videoInfo = {};
          if (
            statsResponseData.input &&
            statsResponseData.input.tracks &&
            statsResponseData.input.tracks.length > 0
          ) {
            // Look for the first track with video information
            for (const track of statsResponseData.input.tracks) {
              if (track.video) {
                videoInfo = {
                  videoWidth: track.video.width,
                  videoHeight: track.video.height,
                  videoBitrate: track.video.bitrate,
                  videoFramerate: track.video.framerate,
                };
                break;
              }
            }
          }

          // Construct the response with stream name, creation time, and video details
          return {
            streamName,
            createdTime:
              statsResponseData.input?.createdTime ||
              statsResponseData.createdTime ||
              "",
            totalConnections: liveStatsResponseData.totalConnections || 0,
            ...videoInfo,
          };
        } catch (error) {
          console.error(
            `Error fetching stats for stream ${streamName}:`,
            error.message
          );
          // Return a partial object or null to indicate failure for this specific stream
          return { streamName, error: "Failed to fetch stats" };
        }
      });

      return await Promise.all(streamDetailsPromises);
    } catch (error) {
      console.error("Error fetching stream data:", error.message);
      // Check for specific error types, e.g., network error vs OME error
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("OME API Error Status:", error.response.status);
        console.error("OME API Error Data:", error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received from OME API:", error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error setting up request to OME API:", error.message);
      }
      throw error; // Re-throw the error or handle it as per application's needs
    }
  }

  /**
   * Checks if a stream name is already in use.
   * @param {string} streamName - The name of the stream to check.
   * @returns {Promise<boolean>} True if the stream name is already in use, false otherwise.
   */
  async isStreamNameInUse(streamName) {
    try {
      if (!streamName || typeof streamName !== "string") {
        throw new Error("Invalid stream name provided for existence check");
      }

      const activeStreamNames = await this.getActiveStreamNames();

      // Perform case-insensitive search to avoid duplicates with different case
      // This is important because some filesystems and systems may treat names as case-insensitive
      const normalizedStreamName = streamName.toLowerCase().trim();
      return activeStreamNames.some(
        (name) => name.toLowerCase().trim() === normalizedStreamName
      );
    } catch (error) {
      console.error(
        `Error checking if stream name "${streamName}" is in use:`,
        error.message
      );
      // Re-throw the error to be handled by the caller, or return a default
      // In case of errors, we could assume the stream name is not in use (false),
      // but this could allow duplicate names if the OME API is down.
      // It's safer to re-throw so the caller can decide what to do.
      throw error;
    }
  }

  /**
   * Fetches a stream thumbnail from OME.
   * @param {string} streamName - The name of the stream.
   * @returns {Promise<Buffer>} The thumbnail image buffer.
   */
  async getStreamThumbnail(streamName) {
    if (!config.ome.thumbnailHost || isNaN(config.ome.thumbnailPort)) {
      console.error("OME Thumbnail host or port is not configured correctly.");
      throw new Error("Thumbnail service is not configured.");
    }
    const thumbnailUrl = `${config.ome.thumbnailProtocol}://${config.ome.thumbnailHost}:${config.ome.thumbnailPort}/${config.ome.appName}/${streamName}/thumb.jpg`;

    try {
      // Use a separate Axios instance or configure omeAxios for this if auth/base URL differs significantly.
      // For now, assuming no auth is needed for thumbnail endpoint and it's a public URL.
      const response = await axios.get(thumbnailUrl, {
        responseType: "arraybuffer", // Crucial for getting image data
        timeout: config.ome.requestTimeout, // Use configured timeout
      });
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching thumbnail for stream ${streamName} from ${thumbnailUrl}:`,
        error.message
      );
      if (error.response) {
        console.error("Thumbnail Fetch Error Status:", error.response.status);
        console.error(
          "Thumbnail Fetch Error Data:",
          error.response.data ? error.response.data.toString() : "N/A"
        );
      }
      throw error; // Re-throw to be handled by the controller
    }
  }

  /**
   * Gets the statistics for a specific stream.
   * @param {string} streamName - The name of the stream to get statistics for.
   * @returns {Promise<Object>} Stream statistics object.
   */

  async getStreamStats(streamName) {
    try {
      if (!streamName || typeof streamName !== "string") {
        throw new Error("Invalid stream name provided for stats retrieval");
      }

      // Normalize the stream name

      const normalizedStreamName = streamName.trim();

      // Check if stream exists first

      const activeStreamNames = await this.getActiveStreamNames();

      const streamExists = activeStreamNames.some(
        (name) => name.toLowerCase() === normalizedStreamName.toLowerCase()
      );

      if (!streamExists) {
        throw new Error(`Stream '${normalizedStreamName}' not found`);
      }

      // Get the stream statistics

      const statsResponse = await omeAxios.get(
        `/v1/vhosts/${config.ome.vhostName}/apps/${config.ome.appName}/streams/${normalizedStreamName}`
      );

      const liveStatsResponse = await omeAxios.get(
        `/v1/stats/current/vhosts/${config.ome.vhostName}/apps/${config.ome.appName}/streams/${normalizedStreamName}`
      );

      // Extract base response data

      const statsResponseData = statsResponse?.data?.response || {};

      const liveStatsResponseData = liveStatsResponse?.data?.response || {};

      // Extract video information from input.tracks if available

      let videoInfo = {};

      if (
        statsResponseData.input &&
        statsResponseData.input.tracks &&
        statsResponseData.input.tracks.length > 0
      ) {
        // Look for the first track with video information

        for (const track of statsResponseData.input.tracks) {
          if (track.video) {
            videoInfo = {
              videoWidth: track.video.width,

              videoHeight: track.video.height,

              videoBitrate: track.video.bitrate,

              videoFramerate: track.video.framerate,
            };

            break;
          }
        }
      }

      // Construct the response with stream name, creation time, and video details

      return {
        streamName: normalizedStreamName,

        createdTime:
          statsResponseData.input?.createdTime ||
          statsResponseData.createdTime ||
          "",

        totalConnections: liveStatsResponseData.totalConnections || 0,

        ...videoInfo,
      };
    } catch (error) {
      console.error(
        `Error fetching stats for stream ${streamName}:`,
        error.message
      );

      // Enhanced error logging

      if (error.response) {
        console.error("OME API Error Status:", error.response.status);

        console.error("OME API Error Data:", error.response.data);
      } else if (error.request) {
        console.error("No response received from OME API:", error.request);
      } else {
        console.error("Error setting up request to OME API:", error.message);
      }

      throw error; // Re-throw to be handled by the controller
    }
  }
}

export default new OmeService();
