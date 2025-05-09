// Utility for managing automatic updates of stream information
// particularly the viewer counter and status

// Refresh duration in milliseconds (1 minute)
const REFRESH_INTERVAL = 10 * 1000;

// Function to fetch stream information
export const fetchStreamInfo = async (streamName) => {
  try {
    const response = await fetch(`/api/v1/streams/${streamName}/stats`);
    if (!response.ok) {
      throw new Error("Error loading stream information");
    }
    
    const data = await response.json();
    return data || null;
  } catch (err) {
    console.error("Error fetching stream information:", err);
    return null;
  }
};

// Function to fetch all stream information
export const fetchAllStreamsInfo = async () => {
  try {
    const response = await fetch(`/api/v1/streams`);
    if (!response.ok) {
      throw new Error("Error loading stream information");
    }
    
    return await response.json();
  } catch (err) {
    console.error("Error fetching all streams information:", err);
    return [];
  }
};

// Function to set up automatic refresh timer for a single stream information
export const setupStreamInfoTimer = (streamName, onUpdate) => {
  // Immediately retrieve information and update UI
  fetchStreamInfo(streamName).then(streamInfo => {
    if (streamInfo) {
      onUpdate(streamInfo);
    }
  });
  
  // Set a timer to update information every minute
  const timerId = setInterval(() => {
    fetchStreamInfo(streamName).then(streamInfo => {
      if (streamInfo) {
        onUpdate(streamInfo);
      }
    });
  }, REFRESH_INTERVAL);
  
  // Return timer ID for cleanup when component unmounts
  return timerId;
};

// Function to set up automatic refresh timer for all streams
export const setupAllStreamsInfoTimer = (onUpdate) => {
  // Immediately retrieve information and update UI
  fetchAllStreamsInfo().then(streamsInfo => {
    if (streamsInfo && streamsInfo.length > 0) {
      onUpdate(streamsInfo);
    }
  });
  
  // Set a timer to update information every minute
  const timerId = setInterval(() => {
    fetchAllStreamsInfo().then(streamsInfo => {
      if (streamsInfo && streamsInfo.length > 0) {
        onUpdate(streamsInfo);
      }
    });
  }, REFRESH_INTERVAL);
  
  // Return timer ID for cleanup when component unmounts
  return timerId;
};

// Function to clean up resources when no longer needed
export const cleanupStreamInfoTimer = (timerId) => {
  if (timerId) {
    clearInterval(timerId);
    console.log("Stream info timer has been cleaned up");
  }
};
