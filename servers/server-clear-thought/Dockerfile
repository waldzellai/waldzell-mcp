FROM node:18-slim

# Install curl for health check
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies (skip prepare script)
RUN npm ci --ignore-scripts

# Fix CommonJS/ESM compatibility issue in Smithery SDK by inlining okay-error functions
RUN sed -i '2,3d' node_modules/@smithery/sdk/dist/shared/config.js && \
    sed -i '2i const ok = (value) => ({ ok: true, value });\nconst err = (error) => ({ ok: false, error });' node_modules/@smithery/sdk/dist/shared/config.js

# Copy source files
COPY . .

# Build the project
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Set executable permissions
RUN chmod +x dist/server.js

# Expose port
EXPOSE 3000

# Run as non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the HTTP server
CMD ["node", "dist/server.js"]

# Label the image
LABEL org.opencontainers.image.source="https://github.com/waldzellai/clear-thought"
LABEL org.opencontainers.image.description="MCP server for systematic thinking, mental models, debugging approaches, and memory management"
LABEL org.opencontainers.image.licenses="MIT"
