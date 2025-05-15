# OvenPlatform Changelog

All notable changes to the OvenPlatform application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.1] - 2025-05-15

### Added - frontend

- Enhanced form validation across all authentication components:
  - Added visual checkmark indicators for valid inputs
  - Implemented consistent validation messages in English
  - Added real-time validation feedback for all form fields
  - Enhanced input field styling with animated validation effects
  - Applied consistent styling to validation messages across all forms
  - Fixed duplicate validation indicators in RegisterPage.jsx

### Changed - frontend

- Standardized validation UI elements across all authentication pages:
  - LoginPage.jsx updated with validation indicators and feedback
  - RegisterPage.jsx cleaned up with consistent styling
  - ResetPasswordPage.jsx updated with improved validation messages
  - All input wrappers now properly position validation indicators
  - Validation messages now use consistent language and styling
  - Success and error states are now visually distinct with proper colors

## [1.4.0] - 2025-05-15

### Added - backend

- Improved validation for user data:
  - Added validation patterns for email, password, and username
  - Created `validators.js` utility with robust validation functions
  - Enhanced error handling for validation issues
  - Added uniqueness checks for email and username fields

### Added - frontend

- Implemented Zod validation for form inputs
- Added real-time password strength validation with visual indicators
- Enhanced all authentication forms with comprehensive validation:
  - Registration form with username, email, and password validation
  - Login form with input validation
  - Password reset forms with strength validation
  - Forgot password form with email validation
- Updated styling for form validation feedback
- Added colored borders for valid inputs (green for valid)
- Added responsive UI with compact design to minimize scrolling

### Changed - backend

- Changed user model from `name` to `username` for better user identification
- Enhanced password requirements (minimum 8 characters, uppercase, lowercase, number, special character)
- Improved user authentication error handling and messaging

### Changed - frontend

- Updated `RegisterPage.jsx`, `LoginPage.jsx`, `ResetPasswordPage.jsx`, and `ForgotPasswordPage.jsx` with Zod validation
- Transformed Auth UI to provide real-time validation feedback
- Updated authentication forms to use username instead of name field
- Enhanced UI with modern animations and colors
- Improved error and success message styling with colored backgrounds
- Updated password requirements display with grid layout for better space efficiency

## [1.3.0] - 2025-05-15

### Changed - backend

- Reorganized API endpoint structure for better organization:
  - Changed `/api/v1/streams` to `/v1/ome/streams` for OvenMediaEngine-related endpoints
  - Changed authentication routes from `/api/v1` to `/v1/auth`
  - Updated OvenMediaEngine authentication from `/auth/v1` to `/v1/ome`
- Updated all documentation to reflect new endpoint structure
- Fixed MongoDB URI construction to handle various connection string formats
- Changed user authentication endpoint from `/v1/auth/me` to `/v1/auth/profile` for better consistency

### Changed - frontend

- Updated all API calls to match new endpoint structure:
  - Updated stream-related requests to use `/v1/ome/streams`
  - Updated authentication requests to use `/v1/auth`
- Enhanced Navbar component to display user information and authentication status
- Improved email verification component to prevent multiple token verification attempts
- Updated authentication service to use `/v1/auth/profile` instead of `/v1/auth/me`

## [1.2.0] - 2025-05-15

### Added - backend

- User authentication system with MongoDB for persistent storage
- New authentication routes:
  - POST `/v1/auth/signup`: Register new users with email verification
  - POST `/v1/auth/login`: User login with JWT in HTTP-only cookies
  - POST `/v1/auth/logout`: User logout with cookie clearing
  - POST `/v1/auth/verify-email`: Email verification functionality
  - POST `/v1/auth/forgot-password`: Password recovery via email
  - POST `/v1/auth/reset-password/:token`: Password reset with secure tokens
- Email service for sending verification and password reset emails using Resend.com
- JWT-based authentication with secure HTTP-only cookies
- User model with hashed passwords and verification tokens
- MongoDB database name configuration via MONGODB_DB_NAME environment variable
- Added authentication protection to all stream routes
- Created comprehensive authentication usage guide in docs/auth-usage-guide.md

### Added - frontend

- Frontend authentication system with complete user flow
- New frontend components:
  - LoginPage: User login with form validation
  - RegisterPage: User registration with form validation
  - ForgotPasswordPage: Password recovery request
  - ResetPasswordPage: Password reset form
  - EmailVerificationPage: Email verification confirmation
  - HomePage: New landing page with application overview
  - ProtectedRoute: Component to secure routes requiring authentication
- Authentication context with React Context API for state management
- Authentication service for API communication
- Secure HTTP-only cookie-based authentication
- New styles for authentication components
- Protection for all stream routes in frontend

### Changed - backend

- Updated configuration file to support user authentication and MongoDB
- Updated CORS middleware to support credentials for cross-origin requests
- Migrated backend to ES module syntax
  - Added "type": "module" to package.json
  - Converted all require/module.exports to import/export syntax
  - Ensured proper file extensions in import paths
- Switched email provider from Mailtrap to Resend.com for better deliverability
- All stream routes now require user authentication
- Improved MongoDB configuration with separate database name setting

### Changed - frontend

- Updated App.jsx with new routing structure
- Enhanced Navbar with authentication status and user information
- Reorganized application flow with login/register before accessing streams

### Fixed - backend

- Fixed module import/export inconsistencies in backend files
- Fixed double export in CORS middleware that was causing a runtime error
- Fixed require() usage in error handler middleware
- Removed CommonJS exports and imports from all files after migrating to ES modules

## [1.1.3] - 2025-05-12

### Changed

- Renamed `getStreamWithStats` function to `getAllActiveStreamsWithStats` for better clarity
- Improved route naming for stream information endpoints
- Updated controller method names to better reflect their functionality

### Added

- New endpoint to get detailed statistics for a specific stream at `/streams/:streamName/stats`
- New service method `getStreamStats` that retrieves comprehensive data about a stream including:
  - Video resolution (width/height)
  - Video bitrate and framerate
  - Total active connections
  - Creation time
- Enhanced error handling with specific error codes for stream stats retrieval

## [1.1.2] - 2025-05-10

### Fixed

- Fixed environment variable handling in Docker builds to support production deployments
- Fixed issue where frontend builds would fail in production mode due to missing development dependencies
- Fixed NODE_ENV detection in check-env.cjs to properly handle Docker environments

### Changed

- Modified environment handling so that production uses `.env` and development uses `.env.development`
- Removed requirement for `.env.production` in production deployments
- Simplified docker-compose configurations to use appropriate environment files based on mode
- Enhanced check-env.cjs to be more tolerant in Docker environments

### Added

- Created comprehensive `.env.example` templates for both frontend and backend
- Added docker-compose.yaml.example for easier deployment configuration
- Created ENV_CONFIG.md with detailed documentation on environment setup
- Added automatic Docker environment detection with DOCKER_BUILD flag

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
