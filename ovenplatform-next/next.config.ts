import type { NextConfig } from "next";

/**
 * Determine the execution environment
 * This helps configure Next.js differently based on whether we're in development or production
 */
const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  /* Core configuration options */
  output: isDev ? undefined : 'standalone', // Optimized for production - creates a standalone build
  poweredByHeader: false, // Removes X-Powered-By header for security reasons
  reactStrictMode: true,  // Helps find potential problems in application
  compress: true,         // Enables gzip compression for smaller files
  env: {
    APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'development'
  },
  // Environment-specific configurations
  ...(isDev ? {
    // Development-only configurations
    webpack: (config) => {
      // Custom webpack configuration for development environment
      return config;
    }
  } : {
    // Production-only configurations
    generateEtags: true,
  })
};

export default nextConfig;
