/**
 * Utility functions for input validation.
 */

/**
 * Validates a stream name according to predefined rules.
 * 
 * @param {string} streamName - The stream name to validate
 * @returns {Object} Result object with isValid boolean and error message if any
 */
const validateStreamName = (streamName) => {
  // Check if streamName is provided and is a string
  if (!streamName || typeof streamName !== 'string') {
    return {
      isValid: false,
      error: {
        code: 'MISSING_STREAM_NAME',
        message: 'Stream name is required and must be a string.',
        status: 400 // Bad Request
      }
    };
  }
  
  // Check minimum length (8 characters)
  if (streamName.length < 8) {
    return {
      isValid: false,
      error: {
        code: 'STREAM_NAME_TOO_SHORT',
        message: 'Stream name must be at least 8 characters long.',
        status: 422 // Unprocessable Entity
      }
    };
  }
  
  // Check for spaces
  if (/\s/.test(streamName)) {
    return {
      isValid: false,
      error: {
        code: 'STREAM_NAME_CONTAINS_SPACES',
        message: 'Stream name cannot contain spaces.',
        status: 422 // Unprocessable Entity
      }
    };
  }
  
  // Check for special characters - allowing only alphanumeric, hyphen and underscore
  if (!/^[a-zA-Z0-9_-]+$/.test(streamName)) {
    return {
      isValid: false,
      error: {
        code: 'STREAM_NAME_INVALID_CHARS',
        message: 'Stream name can only contain letters, numbers, hyphens, and underscores.',
        status: 422 // Unprocessable Entity
      }
    };
  }
  
  // All validations passed
  return {
    isValid: true
  };
};

module.exports = {
  validateStreamName
};
