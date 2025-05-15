/**
 * Utility functions for input validation.
 */

/**
 * Email validation regex pattern
 * This pattern validates email addresses according to RFC 5322 standards
 */
export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Password validation regex pattern
 * Requires at least:
 * - 8 characters
 * - 1 uppercase letter
 * - 1 lowercase letter
 * - 1 number
 * - 1 special character (!@#$%&)
 */
export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&])[A-Za-z\d!@#$%&]{8,}$/;

/**
 * Username validation regex pattern
 * Allows only alphanumeric characters and underscores
 * Must be between 3 and 30 characters
 */
export const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidEmail = (email) => {
  return emailRegex.test(email);
};

/**
 * Validates a password
 * @param {string} password - The password to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidPassword = (password) => {
  return passwordRegex.test(password);
};

/**
 * Validates a username
 * @param {string} username - The username to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidUsername = (username) => {
  return usernameRegex.test(username);
};

/**
 * Generates validation errors for user input
 * @param {Object} user - User data object
 * @returns {Object} - Object containing validation errors if any
 */
export const validateUserInput = (user) => {
  const errors = {};

  // Validate email
  if (!user.email) {
    errors.email = "Email is required";
  } else if (!isValidEmail(user.email)) {
    errors.email = "Please provide a valid email address";
  }

  // Validate username
  if (!user.username) {
    errors.username = "Username is required";
  } else if (!isValidUsername(user.username)) {
    errors.username =
      "Username must be 3-30 characters long and can only contain letters, numbers, and underscores";
  }

  // Validate password
  if (!user.password) {
    errors.password = "Password is required";
  } else if (!isValidPassword(user.password)) {
    errors.password =
      "Password must be at least 8 characters long and include uppercase, lowercase, number and special character (!@#$%&)";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates a stream name according to predefined rules.
 *
 * @param {string} streamName - The stream name to validate
 * @returns {Object} Result object with isValid boolean and error message if any
 */
const validateStreamName = (streamName) => {
  // Check if streamName is provided and is a string
  if (!streamName || typeof streamName !== "string") {
    return {
      isValid: false,
      error: {
        code: "MISSING_STREAM_NAME",
        message: "Stream name is required and must be a string.",
        status: 400, // Bad Request
      },
    };
  }

  // Check minimum length (8 characters)
  if (streamName.length < 8) {
    return {
      isValid: false,
      error: {
        code: "STREAM_NAME_TOO_SHORT",
        message: "Stream name must be at least 8 characters long.",
        status: 422, // Unprocessable Entity
      },
    };
  }

  // Check for spaces
  if (/\s/.test(streamName)) {
    return {
      isValid: false,
      error: {
        code: "STREAM_NAME_CONTAINS_SPACES",
        message: "Stream name cannot contain spaces.",
        status: 422, // Unprocessable Entity
      },
    };
  }

  // Check for special characters - allowing only alphanumeric, hyphen and underscore
  if (!/^[a-zA-Z0-9_-]+$/.test(streamName)) {
    return {
      isValid: false,
      error: {
        code: "STREAM_NAME_INVALID_CHARS",
        message:
          "Stream name can only contain letters, numbers, hyphens, and underscores.",
        status: 422, // Unprocessable Entity
      },
    };
  }

  // All validations passed
  return {
    isValid: true,
  };
};

export { validateStreamName };
