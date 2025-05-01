# Use the official Node.js 18 Slim image as a parent image
FROM node:18-slim AS builder

WORKDIR /app

# Copy root lockfile and package.json (for workspace structure)
COPY package.json yarn.lock ./
COPY .yarnrc.yml ./

# Copy the specific package.json for this server
COPY packages/server-yelp-fusionai/package.json ./packages/server-yelp-fusionai/

# Copy the common package components needed for build
COPY packages/common/package.json ./packages/common/
COPY packages/common/tsconfig.json ./packages/common/
COPY packages/common/src ./packages/common/src

# Copy root tsconfig (needed for extends)
COPY tsconfig.json ./

# Copy the specific tsconfig.json for this server
COPY packages/server-yelp-fusionai/tsconfig.json ./packages/server-yelp-fusionai/

# Enable Corepack
RUN corepack enable

# Install dependencies using Yarn workspaces
RUN yarn install

# Copy source files for this specific package
COPY packages/server-yelp-fusionai/src ./packages/server-yelp-fusionai/src

# Build the package (using the script from package.json)
# Ensure the build command is run in the context of the specific package
RUN cd packages/server-yelp-fusionai && yarn run build
# Debug: list build output
RUN ls -la /app/packages/server-yelp-fusionai/dist 

# --- Runtime Stage ---
# Use a smaller image for production
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy necessary files from the builder stage
# Copy production node_modules (built from root context)
COPY --from=builder /app/node_modules ./node_modules
# Copy the specific package.json for runtime
COPY --from=builder /app/packages/server-yelp-fusionai/package.json ./
# Copy the built application code
COPY --from=builder /app/packages/server-yelp-fusionai/dist ./dist

# Install production dependencies only using Yarn
# Keep --immutable here for the production stage
RUN yarn install --production --immutable

# Command to run the application
CMD ["node", "dist/index.js"]