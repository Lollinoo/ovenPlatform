import crypto from "crypto";
import config from "../config.js";
import { validateStreamName } from "../utils/validators.js";

// Secret key for HMAC-SHA1 validation
const OME_API_SECRET_KEY = config.ome.apiSecretKey;
const SIGNED_POLICY_SECRET_KEY = config.ome.SignedPolicySecretKey;

// In-memory store for dynamically authorized streams
const dynamicallyAuthorizedStreams = new Set();

class AuthController {
  /**
   * Handles admission requests from OvenMediaEngine.
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async handleAdmission(req, res) {
    const signature = req.headers["x-ome-signature"];
    const rawBody = req.rawBody;

    if (!OME_API_SECRET_KEY) {
      console.error("Auth: OME_API_SECRET_KEY is not configured. Cannot validate X-OME-Signature.");
      return res.status(500).json({ error: "Server configuration error: Missing OME API secret key." });
    }

    if (!signature) {
      console.warn("Auth: Admission request received without X-OME-Signature");
      return res.status(401).json({ error: "Missing X-OME-Signature header" });
    }

    if (!rawBody) {
      console.error("Auth: Raw body not available for signature validation.");
      // This indicates a configuration problem with the middleware in server.js
      return res.status(500).json({
        error: "Internal server error: raw body not available.",
      });
    }

    try {
      const hmac = crypto.createHmac("sha1", OME_API_SECRET_KEY);
      hmac.update(rawBody);
      let calculatedSignature = hmac.digest("base64");
      calculatedSignature = calculatedSignature
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      if (signature !== calculatedSignature) {
        console.warn(
          `Auth: Invalid X-OME-Signature. Received: ${signature}, Calculated: ${calculatedSignature}`
        );
        return res
          .status(403)
          .json({ error: "Invalid X-OME-Signature" });
      }

      // Signature is valid, now process the JSON payload
      const payload = JSON.parse(rawBody.toString("utf8"));
      console.log(
        "Auth: Valid admission request received:",
        JSON.stringify(payload, null, 2)
      );

      const requestStatus = payload.request?.status;
      const streamUrl = payload.request?.url;

      if (requestStatus === "opening") {
        if (!streamUrl) {
          console.warn("Auth: Stream URL not present in payload for 'opening' status.");
          return res.status(400).json({ allowed: false, reason: "Missing stream URL" });
        }

        const [path, queryString] = streamUrl.split("?");
        const urlParams = new URLSearchParams(queryString);
        const policySignature = urlParams.get("signature");
        const policyParam = urlParams.get("policy");
        let policyExpiresTimestampMs;

        if (policyParam) {
          try {
            const decodedPolicy = Buffer.from(policyParam, "base64url").toString("utf8"); // Use base64url for decoding
            const policyJson = JSON.parse(decodedPolicy);
            if (policyJson.url_expire && Number.isFinite(policyJson.url_expire)) {
              policyExpiresTimestampMs = policyJson.url_expire; // Assuming policy.url_expire is already in milliseconds
            } else {
              console.warn(`Auth: Invalid or missing 'url_expire' in policy parameter: ${decodedPolicy}`);
              return res.status(400).json({ allowed: false, reason: "Malformed 'policy' parameter: invalid 'url_expire'" });
            }
          } catch (e) {
            console.warn(`Auth: Error decoding or parsing 'policy' parameter: ${e.message}`);
            return res.status(400).json({ allowed: false, reason: "Malformed 'policy' parameter" });
          }
        } else {
          // Fallback for direct url_expire if policy parameter is not present (for backward compatibility or other scenarios)
          const urlExpireParam = urlParams.get("url_expire");
          if (urlExpireParam && Number.isFinite(parseInt(urlExpireParam, 10))) {
            policyExpiresTimestampMs = parseInt(urlExpireParam, 10) * 1000; // Convert seconds to milliseconds
          } 
        }
        
        const urlParts = path.split("/");
        const streamName = urlParts.pop() || urlParts.pop(); // Handles trailing slash

        console.log(`Auth: Attempting to start stream: ${streamName}`);

        // Validate the stream name
        const validation = validateStreamName(streamName);
        if (!validation.isValid) {
          console.warn(`Auth: Invalid stream name "${streamName}": ${validation.error.message}`);
          return res.status(validation.error.status).json({ 
            allowed: false, 
            reason: validation.error.message,
            code: validation.error.code
          });
        }

        // Signed Policy Validation
        if (policySignature && policyExpiresTimestampMs !== undefined) {
          if (!SIGNED_POLICY_SECRET_KEY) {
            console.error("Auth: SIGNED_POLICY_SECRET_KEY is not configured. Cannot validate signed policy.");
            return res.status(500).json({ allowed: false, reason: "Server configuration error: Missing signed policy secret key." });
          }

          console.log(`Auth: Found Signed Policy for ${streamName}. Signature: ${policySignature}, Expires (ms): ${policyExpiresTimestampMs}`);
          const now = Date.now();

          if (policyExpiresTimestampMs < now) {
            console.warn(`Auth: Signed Policy for ${streamName} has expired. Expiration (ms): ${policyExpiresTimestampMs}, Current time (ms): ${now}`);
            return res.status(403).json({ allowed: false, reason: "Signed Policy expired" });
          }

          const paramsForSigning = new URLSearchParams();
          for (const [key, value] of urlParams.entries()) {
            if (key !== "signature") {
              paramsForSigning.append(key, value);
            }
          }
          const queryStringForSigning = paramsForSigning.toString();
          let stringToSign = path;
          if (queryStringForSigning) {
            stringToSign += `?${queryStringForSigning}`;
          }

          // If not using the 'policy' parameter, and the client's signing logic expects 'url_expire' (in seconds) to be appended.
          // This was a specific behavior in a previous version, ensure client and server logic match.
          // Modern approach with 'policy' parameter is preferred as it encapsulates all policy details.
          if (!policyParam && urlParams.has("url_expire")) { 
             // This specific concatenation was in the original code for the non-policy case.
             // It assumes url_expire (seconds) was appended to the string before signing on the client-side.
             // Ensure this matches client-side signature generation if this path is used.
            stringToSign = `${stringToSign}${urlParams.get("url_expire")}`;
          }

          const hmacPolicy = crypto.createHmac("sha1", SIGNED_POLICY_SECRET_KEY);
          hmacPolicy.update(stringToSign);
          let calculatedPolicySignature = hmacPolicy.digest("base64url"); // Use base64url for consistency

          if (policySignature !== calculatedPolicySignature) {
            console.warn(`Auth: Invalid Signed Policy signature for ${streamName}. Received: ${policySignature}, Calculated: ${calculatedPolicySignature}, String Signed: '${stringToSign}'`);
            return res.status(403).json({ allowed: false, reason: "Invalid Signed Policy signature" });
          }

          console.log(`Auth: Signed Policy for ${streamName} is valid.`);
          dynamicallyAuthorizedStreams.add(streamName);
          console.log(`Auth: Stream '${streamName}' dynamically authorized (Signed Policy OK). Added to list. Response: { allowed: true }`);
          return res.status(200).json({ allowed: true });

        } else {
          console.warn(`Auth: Missing Signed Policy parameters for ${streamName}. Request denied.`);
          return res.status(403).json({ allowed: false, reason: "Missing Signed Policy parameters" });
        }

      } else if (requestStatus === "closing") {
        // For 'closing' status, maintain current logic (allow)
        // Optionally, remove the stream from `dynamicallyAuthorizedStreams` here if needed.
        // Example:
        if (streamUrl) {
          const [path] = streamUrl.split("?");
          const urlParts = path.split("/");
          const streamName = urlParts.pop() || urlParts.pop();
          if (streamName) {
            dynamicallyAuthorizedStreams.delete(streamName);
            console.log(`Auth: Stream '${streamName}' removed from authorized list (closing).`);
          }
        }
        console.log("Auth: Response for 'closing' status: {}");
        return res.status(200).json({}); // OME expects an empty JSON object for allowed closing requests
      } else {
        // For other statuses or if status is not specified, allow for now.
        console.log(`Auth: Response for status not specified or other than 'opening'/'closing': {}`);
        return res.status(200).json({}); // OME expects an empty JSON object for allowed requests
      }
    } catch (error) {
      console.error("Auth: Error handling admission request:", error);
      if (error instanceof SyntaxError) {
        return res.status(400).json({ error: "Malformed JSON payload" });
      }
      return res.status(500).json({
        error: "Internal server error while handling admission request",
      });
    }
  }
}

export default new AuthController();
