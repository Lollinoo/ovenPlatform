# Environment Configuration for OvenPlatform

This document explains how to configure the environment variables for OvenPlatform.

## Automated Configuration

You can use our automated deployment script to set up the environment configuration:

```bash
# For development environment setup
./deploy.sh --env development

# For production environment setup
./deploy.sh --env production
```

The script will create the necessary environment files and guide you through the configuration process.

## Environment Files

OvenPlatform uses different environment files depending on the execution mode:

- **Production**: Uses `.env` for both frontend and backend
- **Development**: Uses `.env.development` for both frontend and backend

## Setting Up Environment Files

### Frontend (ovenPlatform-web)

1. Copy the example template to create your environment file:
   ```bash
   # For production
   cp .env.example .env
   
   # For development
   cp .env.example .env.development
   ```

2. Edit the file to provide your specific configuration values.

Required variables for frontend:
- `VITE_APP_NAME`: Application name
- `VITE_WEBRTC_URL_BASE`: WebRTC connection URL
- `VITE_LLHLS_URL_BASE`: Low-Latency HLS URL
- `VITE_TURN_SERVER_URL_UDP`: TURN server URL for UDP
- `VITE_TURN_SERVER_URL_TCP`: TURN server URL for TCP
- `VITE_TURN_SERVER_USERNAME`: TURN server username
- `VITE_TURN_SERVER_CREDENTIAL`: TURN server credential

### Backend (ovenPlatform-be)

1. Copy the example template to create your environment file:
   ```bash
   # For production
   cp .env.example .env
   
   # For development
   cp .env.example .env.development
   ```

2. Edit the file to provide your specific configuration values.

Required variables for backend:
- `NODE_PORT`: Port for the backend server
- `FRONTEND_URL`: URL of the frontend application
- `OME_PROTOCOL`: Protocol for OvenMediaEngine (http/https)
- `OME_HOST`: Host address for OvenMediaEngine
- `OME_PORT`: Port for OvenMediaEngine
- `OME_RTMP_PORT`: RTMP port for OvenMediaEngine
- `OME_AUTH_USERNAME`: Username for OvenMediaEngine authentication
- `OME_AUTH_PASSWORD`: Password for OvenMediaEngine authentication

## Docker Deployment

When deploying with Docker, the environment variables are loaded from:

### Development Deployment
```yaml
env_file:
  - ../ovenPlatform-web/.env.development  # Frontend
  - ../ovenPlatform-be/.env.development   # Backend
```

### Production Deployment
```yaml
env_file:
  - ../ovenPlatform-web/.env  # Frontend
  - ../ovenPlatform-be/.env   # Backend
```

## Example docker-compose.yaml

For a full deployment, you can use the provided example:

```bash
cp docker-compose.yaml.example docker-compose.yaml
cp .env.example .env
```

Then customize the `.env` file and `docker-compose.yaml` as needed for your environment.

## Checking Environment Configuration

You can use the built-in environment checker to validate your configuration:

```bash
# For development
NODE_ENV=development npm run check-env

# For production
NODE_ENV=production npm run check-env
```

## Interactive Setup

You can also use the interactive setup script:

```bash
npm run setup-env
```

This will guide you through setting up the correct environment variables for your chosen deployment type.
