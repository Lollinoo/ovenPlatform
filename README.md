# OvenPlatform Live Streaming Service

A scalable live streaming platform built with OvenMediaEngine, Next.js, and containerized with Docker.

## Project Overview

This platform provides a complete solution for live streaming:

- **Frontend**: Next.js application for stream viewing and management
- **Backend**: API server for stream control and management
- **Streaming Engine**: OvenMediaEngine for handling live video streams

## Repository Structure

```
ovenPlatform/
├── ovenplatform-next/    # Next.js frontend application
├── docker-compose.yml    # Docker Compose configuration
├── CHANGELOG.md          # Project changelog
└── COMMIT_MESSAGES.md    # Track of changes made to the project
```

## Environment Configuration

The project supports multiple environments:

- **Development**: For local development with hot-reloading
- **Production**: Optimized for deployment

Each component has its own environment-specific configuration files.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

### Running the Platform

1. Clone this repository
2. Start the entire platform:

```bash
docker-compose up
```

Or start specific environments:

```bash
# Development environment
docker-compose up nextjs-dev

# Production environment
docker-compose up nextjs-prod
```

## Development

### Frontend (Next.js)

See the [frontend README](./ovenplatform-next/README.md) for detailed information.

### Adding New Components

When adding new components to the platform:
1. Update the docker-compose.yml file
2. Document changes in COMMIT_MESSAGES.md
3. Update CHANGELOG.md for significant changes

## Deployment

For production deployment:

1. Configure production environment variables
2. Build and start the production containers:

```bash
docker-compose up --build nextjs-prod
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Document all changes in COMMIT_MESSAGES.md
4. Update CHANGELOG.md if needed
5. Submit a pull request

## License

This project is licensed under the terms specified in the LICENSE file.
