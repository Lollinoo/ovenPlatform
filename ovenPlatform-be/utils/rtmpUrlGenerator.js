import config from "../config.js";
import base64url from "base64url";
import crypto from "crypto";

/**
 * Generates a long-lived RTMP URL (5 years) for a verified user
 * @param {string} streamName - The stream name to use, typically the username
 * @returns {Object} - The signed URL and expiration date
 */
async function generateLongLivedRtmpUrl(streamName) {
  try {
    const HMAC_KEY = config.ome.SignedPolicySecretKey;
    if (!HMAC_KEY) {
      throw new Error("SignedPolicySecretKey not configured");
    }

    // Ensure this template matches your OME configuration
    const BASE_URL_TEMPLATE = `rtmp://${config.ome.host}:${config.ome.rtmpPort}/${config.ome.appName}/`;
    const SIGNATURE_QUERY_KEY_NAME = "signature";
    const POLICY_QUERY_KEY_NAME = "policy";

    const baseUrl = `${BASE_URL_TEMPLATE}${streamName.trim()}`;

    // Create a policy with a 5-year expiration (instead of 3 minutes)
    const FIVE_YEARS_IN_SECONDS = 5 * 365 * 24 * 60 * 60; // 5 years
    const expirationTimestamp = Date.now() + FIVE_YEARS_IN_SECONDS * 1000;
    const policy = JSON.stringify({ url_expire: expirationTimestamp });

    const policyBase64 = base64url(Buffer.from(policy, "utf8"));

    const qsSeparator = baseUrl.includes("?") ? "&" : "?";
    let policyUrl =
      baseUrl + qsSeparator + POLICY_QUERY_KEY_NAME + "=" + policyBase64;

    const signature = base64url(
      crypto.createHmac("sha1", HMAC_KEY).update(policyUrl).digest()
    );

    const signedUrl =
      policyUrl + "&" + SIGNATURE_QUERY_KEY_NAME + "=" + signature;

    return {
      signedUrl,
      expiresAt: new Date(expirationTimestamp),
    };
  } catch (error) {
    console.error("Error generating long-lived RTMP URL:", error);
    throw error;
  }
}

export default generateLongLivedRtmpUrl;
