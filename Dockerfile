# Multi-stage build for LANdex
# Stage 1: Build the React client
FROM node:24-alpine AS client-builder

# Set working directory for client build
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install dependencies using npm workspaces
RUN npm ci --only=production=false

# Copy client source code
COPY client/ ./client/

# Build the client
RUN npm run --prefix client build

# Stage 2: Production server
FROM node:24-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY server/package.json ./server/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy server source code
COPY server.js ./
COPY server/ ./server/
COPY servers.json ./

# Initialize servers.json with empty array if it doesn't exist or is empty
RUN if [ ! -s ./servers.json ]; then echo '[]' > ./servers.json; fi

# Copy built client from previous stage
COPY --from=client-builder /app/client/dist ./public

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/servers', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the server
CMD ["npm", "run", "start:server"]
