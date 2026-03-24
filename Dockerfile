# Multi-stage build for Sanderson RPG
# Stage 1: Build Angular app
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root package files and install (includes Angular CLI)
# --legacy-peer-deps: @analogjs test packages lag behind Angular 21 peer deps
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy Angular/TS config and source
COPY tsconfig*.json angular.json ./
COPY src ./src
COPY public ./public
COPY shared ./shared

# Build Angular app
RUN npx ng build --configuration production

# Stage 2: Production server
FROM node:22-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy Prisma schema, config, and root package (for prisma generate)
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npx prisma generate

# Install server dependencies (tsx needed at runtime for TypeScript execution)
COPY server/package*.json ./server/
RUN cd server && npm ci

# Copy server source and shared modules
COPY server ./server
COPY shared ./shared

# Copy built Angular app from builder stage into where server expects it
COPY --from=builder /app/dist/project-sanderson/browser ./server/dist

# Copy entrypoint script
COPY deploy/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create persistent data directories
RUN mkdir -p /app/prisma /app/server/characters /app/server/images

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
