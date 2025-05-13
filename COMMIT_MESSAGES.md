# Commit Messages

This file tracks all changes made to the project for better maintainability and collaboration.

## May 13, 2025

### Major Changes

- **Environment Setup**: Created development and production environment configurations
  - Added `.env.development`, `.env.production`, and `.env` files
  - Updated `next.config.ts` to handle different environments
  - Created centralized config handler in `app/config.ts`

- **Docker Configuration**:
  - Added `Dockerfile` for production with optimizations
  - Added `Dockerfile.dev` for development with hot-reload
  - Created `docker-compose.yml` with both environments

- **Documentation Improvements**:
  - Updated all comments to English
  - Created comprehensive README.md files
  - Added detailed documentation to configuration files
  - Created CHANGELOG.md to track version changes

### Minor Changes

- Added `env-cmd` dependency for better environment variable management
- Created `.dockerignore` to optimize Docker builds
- Enhanced npm scripts with environment-specific commands
- Improved Docker configurations with better security practices
- Added better code comments throughout the codebase
