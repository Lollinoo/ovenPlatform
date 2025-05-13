# OvenPlatform Next.js Frontend

This is the frontend application for the OvenPlatform live streaming service, built with [Next.js](https://nextjs.org) and integrated with [OvenMediaEngine](https://ovenmediaengine.com/).

## Environment Setup

This project is configured to support multiple environments:

- **Development**: For local development with hot-reloading
- **Production**: Optimized build for deployment

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Docker and Docker Compose (for containerized setup)

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Using Docker

We provide Docker configurations for both development and production environments:

#### Development

```bash
docker-compose up nextjs-dev
```

#### Production (Simulated)

```bash
docker-compose up nextjs-prod
```

The production build will be available at [http://localhost:3001](http://localhost:3001).

## Environment Variables

Environment-specific configuration is managed through `.env` files:

- `.env`: Common variables for all environments
- `.env.development`: Development-specific variables
- `.env.production`: Production-specific variables
- `.env.local`: Local overrides (not committed to repository)

See `.env.example` for available configuration options.

## Project Structure

```
ovenplatform-next/
├── app/               # Next.js App Router structure
│   ├── config.ts      # Centralized environment configuration
│   └── ...            # Pages and components
├── public/            # Static assets
├── next.config.ts     # Next.js configuration
└── ...
```

## Build and Deployment

### Build for Development

```bash
npm run build:dev
```

### Build for Production

```bash
npm run build:prod
```

### Run Production Build

```bash
npm run start:prod
```

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add some amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

See the LICENSE file for details.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
