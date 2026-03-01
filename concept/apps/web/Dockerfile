# =============================================================================
# Taskify Frontend - Production Dockerfile
# =============================================================================
# Multi-stage build:
#   Stage 1: Build the React application with Vite
#   Stage 2: Serve static files with Nginx
#
# Key differences from Dockerfile.dev:
#   - Builds static assets (npm run build)
#   - Serves via Nginx (not Vite dev server)
#   - VITE_API_URL is baked in at build time via --build-arg
#   - No HMR, no bind mounts
#
# Usage:
#   docker build --build-arg VITE_API_URL=https://... -t taskify-web .
# =============================================================================

# Stage 1: Build the React application
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_URL is baked into the JavaScript bundle at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
