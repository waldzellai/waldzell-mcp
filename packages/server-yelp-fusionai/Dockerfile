FROM node:18-slim AS builder

WORKDIR /app

# Copy root lockfile and package.json (for workspace structure)
COPY package.json yarn.lock ./

# Copy the specific package.json for this server
COPY packages/server-yelp-fusionai/package.json ./packages/server-yelp-fusionai/

# Copy the common package dependency
COPY packages/common ./packages/common

# Copy root tsconfig (needed for extends)
COPY tsconfig.json ./

# Copy the specific tsconfig.json for this server
COPY packages/server-yelp-fusionai/tsconfig.json ./packages/server-yelp-fusionai/

# --> Enable Corepack
RUN corepack enable

# Install dependencies using Yarn workspaces
# This should install dependencies for all workspaces defined in the root package.json
# --immutable removed temporarily for debugging lockfile issues
RUN yarn install

# Copy source files for this specific package
COPY packages/server-yelp-fusionai/src ./packages/server-yelp-fusionai/src

# Build the package (using the script from package.json)
# Ensure the build command is run in the context of the specific package
RUN cd packages/server-yelp-fusionai && yarn run build

# Use a smaller image for production
FROM node:18-slim

WORKDIR /app

# Copy necessary files from the builder stage
# package.json and yarn.lock were copied to builder's /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/server-yelp-fusionai/package.json ./
COPY --from=builder /app/packages/server-yelp-fusionai/dist ./dist

# Copy necessary files from common package if needed at runtime (adjust path as necessary)
# Example: COPY --from=builder /app/packages/common/dist ./common/dist

# Install production dependencies only using Yarn
# Keep --immutable here for the production stage
RUN yarn install --production --immutable

# Command to run the application
CMD ["node", "dist/index.js"]