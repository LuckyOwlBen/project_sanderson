# Multi-stage build for Sanderson RPG
# Stage 1: Build Angular app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY angular.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY public ./public

# Build Angular app
RUN npm run build --configuration production

# Stage 2: Production server
FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY server/package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy backend code
COPY server/server.js ./

# Copy built Angular app from builder stage
COPY --from=builder /app/dist/project-sanderson/browser ./dist

# Create characters directory
RUN mkdir -p /app/characters

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Start server
CMD ["node", "server.js"]
