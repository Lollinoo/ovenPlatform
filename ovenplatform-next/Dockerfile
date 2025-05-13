# Production Dockerfile for Next.js application
# This Dockerfile uses a multi-stage build for optimization

# -----------------------------------------------------
# Stage 1: Build stage - Compiles the Next.js application
# -----------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifest files
COPY package*.json ./
COPY .env.production ./

# Install dependencies using clean install for reproducible builds
RUN npm ci

# Copy source code
COPY . .

# Build the production-ready application
RUN npm run build:prod

# -----------------------------------------------------
# Stage 2: Production stage - Minimal runtime environment
# -----------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV production

# Create non-root user for security best practices
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary files from the build stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Use non-root user for better security
USER nextjs

# Expose the application port
EXPOSE 3000

# Start the Next.js server
CMD ["node", "server.js"]
