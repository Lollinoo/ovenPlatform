# OvenPlatform Changelog

All notable changes to the OvenPlatform application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2025-05-10

### Fixed
- Resolved environment variables handling issue where production deployment was requiring development environment variables
- Updated environment check script to be mode-aware, only validating variables relevant to the current NODE_ENV
- Improved Dockerfile.prod to properly handle environment files for production builds
- Updated docker-compose configuration to ensure consistent environment handling

### Added
- New `setup-env.cjs` script to assist with environment configuration
- Detailed deployment guide (DEPLOYMENT.md) with instructions for different environments
- Interactive environment variable setup process

## [1.1.0] - 2025-05-10

### Added
- Real-time validation for stream name input with the following requirements:
  - Minimum 8 characters
  - No spaces allowed
  - Only letters, numbers, hyphens, and underscores permitted
- Visual feedback indicators for validation requirements
- Animation effects for validation states

### Enhanced
- Modal container with gradient backgrounds and subtle animations
- Form elements with improved focus states and transitions
- Buttons with gradient backgrounds and hover/active effects
- Status messages (success, waiting, error) with consistent styling and animations
- Custom scrollbar styling for better visual integration
- Stream URL sections with improved visual design
- Encoder info section with gradient backgrounds and hover effects

### Changed
- Replaced basic validation UI with modern interactive indicators
- Updated button styles with shine animations and improved state handling
- Improved error and success message feedback with icons and animations
- Enhanced copy button behavior with visual feedback
- Refined typography and spacing throughout the interface

### Technical
- Implemented CSS transitions and animations for more dynamic user interactions
- Added backdrop filters for modern glass effects
- Improved component structure for better maintainability
