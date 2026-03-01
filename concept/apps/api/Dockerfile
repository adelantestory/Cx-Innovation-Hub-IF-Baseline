# =============================================================================
# Taskify Backend API - Production Dockerfile
# =============================================================================
# Builds a production-ready container for Azure Container Apps deployment.
# Uses a multi-stage build to keep the final image small.
#
# Key differences from Dockerfile.dev:
#   - No nodemon; runs node directly
#   - NODE_ENV=production
#   - All source code is COPY'd into the image (no bind mounts)
#   - Only production dependencies are installed
# =============================================================================

# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Production image
FROM node:20-alpine
WORKDIR /app

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY package*.json ./
COPY src/ ./src/

# Set production environment
ENV NODE_ENV=production

EXPOSE 3000

# Run as non-root user for security
USER node

CMD ["node", "src/index.js"]
