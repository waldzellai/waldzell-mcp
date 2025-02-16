FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build the project
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Set executable permissions
RUN chmod +x dist/index.js

# Run as non-root user
USER node

# Start the server
CMD ["node", "dist/index.js"]

# Label the image
LABEL org.opencontainers.image.source="https://github.com/glassBead-tc/server-glassBead-thinks"
LABEL org.opencontainers.image.description="MCP server for sequential thinking, mental models, and debugging approaches"
LABEL org.opencontainers.image.licenses="MIT"
