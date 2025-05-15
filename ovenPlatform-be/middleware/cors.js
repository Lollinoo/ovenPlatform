import config from "../config.js";

// Middleware for CORS management
const allowedOrigin = `${config.app.frontendUrl}`; // Define the allowed origin

const enableCors = (req, res, next) => {
  const requestOrigin = req.headers.origin;

  // Set Vary: Origin header to ensure correct caching behavior for CORS responses.
  // This header tells caches that the response may vary based on the Origin request header.
  res.header('Vary', 'Origin');

  // Only allow requests from the configured frontend URL.
  if (requestOrigin === allowedOrigin) {
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    // Allow credentials (cookies, authorization headers, or TLS client certificates)
    res.header('Access-Control-Allow-Credentials', 'true');
  } else if (!requestOrigin) {
    // For requests without an Origin header (e.g., server-to-server, or non-CORS requests like curl),
    // it's generally safe to proceed without setting CORS headers, or you might decide
    // to block them if an Origin is always expected for your use case.
  } else {
    // If the origin is present but not allowed, do not set Access-Control-Allow-Origin.
    // The browser will block the request.
    // Optionally, you could explicitly deny or respond with an error, but typically
    // not setting the header is sufficient for CORS-compliant browsers to block.
    console.warn(`Blocked CORS request from origin: ${requestOrigin}`);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-OME-Signature');
  // Allow cookies to be sent with cross-origin requests
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle OPTIONS (preflight) requests
  if (req.method === 'OPTIONS') {
    // Preflight requests must receive CORS headers.
    // If requestOrigin is not allowedOrigin, Access-Control-Allow-Origin will not be set,
    // and the preflight request will fail in the browser, as intended.
    return res.status(204).end(); // Use 204 No Content for preflight, as per best practices
  }
  next();
};

export default enableCors;