import config from "../config.js"; // Changed to ESM import

/**
 * Centralized error handling middleware.
 */
const errorHandler = (err, req, res, next) => {
  // Log the error for debugging purposes. Consider using a dedicated logger in production.
  console.error("Error Handler Caught:", {
    message: err.message,
    status: err.status || err.statusCode,
    stack: config.NodeEnv !== "production" ? err.stack : undefined, // Only show stack in non-production
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    }
  });

  // Determine status code and message
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Specific error type handling
  if (err.name === "ValidationError") { // Example for a validation library
    statusCode = 400;
    message = err.message || "Validation failed. Please check your input.";
  } else if (err.name === "UnauthorizedError") { // Example for JWT auth errors (e.g., from express-jwt)
    statusCode = 401;
    message = err.message || "Authentication failed.";
  } else if (err.isAxiosError) {
    // More specific handling for Axios errors (e.g., from OmeService)
    statusCode = err.response?.status || 502; // Bad Gateway if OME or other external service is down/errors
    message = err.response?.data?.message || err.response?.statusText || "Error communicating with an external service.";
    console.error("Axios Error Details:", JSON.stringify(err.toJSON(), null, 2));
  }

  // Prepare the error response object
  const errorResponse = {
    status: "error",
    message: message,
  };

  // In development, include more error details like the stack trace or the error object itself
  if (config.NodeEnv !== "production") {
    errorResponse.error = { ...err, stack: err.stack }; // Include more details in non-production
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;