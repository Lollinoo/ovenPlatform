# OvenPlatform Deployment Guide

This guide explains how to deploy the OvenPlatform application in different environments.

## Quick Deployment

The simplest way to deploy OvenPlatform is using our automated deployment script:

```bash
# For development deployment
./deploy.sh --env development

# For production deployment
./deploy.sh --env production
```

This script will:
1. Check prerequisites (Docker, Docker Compose)
2. Set up appropriate environment files
3. Build Docker images
4. Start the containers

## Environment Setup

OvenPlatform uses environment files to configure the application for different deployment scenarios. The application supports development and production environments.

### Using the Environment Setup Script

We provide a script to help you set up the necessary environment files:

```bash
# Navigate to the frontend directory
cd ovenPlatform-web

# Run the setup script
npm run setup-env
```

This interactive script will guide you through setting up the environment files for your chosen deployment type.

### Manual Environment Setup

If you prefer to set up the environment files manually:

1. Create a `.env` file in the root of the `ovenPlatform-web` directory with common settings
2. Create either:
   - `.env.development` for development deployments
   - `.env.production` for production deployments

#### Required Environment Variables

**Base (`.env`)**:
- `VITE_APP_NAME`: The name of the application

**Development (`.env.development`)**:
- `VITE_WEBRTC_URL_BASE`: WebRTC connection URL
- `VITE_LLHLS_URL_BASE`: Low-Latency HLS URL
- `VITE_TURN_SERVER_URL_UDP`: TURN server URL for UDP connections
- `VITE_TURN_SERVER_URL_TCP`: TURN server URL for TCP connections
- `VITE_TURN_SERVER_USERNAME`: TURN server username
- `VITE_TURN_SERVER_CREDENTIAL`: TURN server credential

**Production (`.env.production`)**:
- Same as development, but typically with production-ready values

## Docker Deployment

### Development Deployment

```bash
# Build the development images
cd ovenPlatform-web
npm run docker-build:dev

cd ../ovenPlatform-be
npm run docker-build:dev

# Start the development services
cd ../ovenPlatform-depl
docker-compose -f compose.dev.yaml up -d
```

### Production Deployment

```bash
# Build the production images
cd ovenPlatform-web
npm run docker-build:prod

cd ../ovenPlatform-be
npm run docker-build:prod

# Start the production services
cd ../ovenPlatform-depl
docker-compose -f compose.prod.yaml up -d
```

## Troubleshooting

### Environment Validation Errors

If you encounter environment validation errors:

1. Run the environment check script to see which variables are missing:
   ```bash
   cd ovenPlatform-web
   npm run check-env
   ```

2. Make sure you have the correct environment files for your deployment scenario.

3. Use the setup script to regenerate the environment files:
   ```bash
   npm run setup-env
   ```

### Docker Networking Issues

If services cannot communicate with each other:

1. Check that all containers are running in the same network:
   ```bash
   docker network inspect oven-network
   ```

2. Verify that the environment variables correctly reference the service names from the docker-compose file.

## Version Information

For version history and changelog, see:
- `VERSION.md`: Current version and version history
- `CHANGELOG.md`: Detailed list of changes in each version
