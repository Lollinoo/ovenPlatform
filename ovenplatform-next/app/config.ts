/**
 * Centralized configuration for environment variables access
 * Use this file instead of directly accessing process.env in components
 * 
 * This approach provides several benefits:
 * - Type safety for environment variables
 * - Default values for local development
 * - Centralized management of environment configuration
 * - Easier testing and mocking
 */

export const config = {
  // API and services configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  streamingServer: process.env.NEXT_PUBLIC_STREAMING_SERVER || 'http://localhost:9999',
  
  // Environment settings
  appEnv: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  isDev: process.env.NEXT_PUBLIC_APP_ENV === 'development',
  isProd: process.env.NEXT_PUBLIC_APP_ENV === 'production',
  
  // Feature flags - enable/disable features based on environment
  debugMode: process.env.NEXT_PUBLIC_APP_ENV === 'development',
};

/**
 * Helper functions to check current environment
 * Use these functions instead of directly comparing config.appEnv
 */

/**
 * Checks if the application is running in production mode
 * @returns {boolean} True if app is in production environment
 */
export const isProduction = () => config.appEnv === 'production';

/**
 * Checks if the application is running in development mode
 * @returns {boolean} True if app is in development environment
 */
export const isDevelopment = () => config.appEnv === 'development';
