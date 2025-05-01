FROM node:18-slim AS builder

WORKDIR /app

# Copy package files first for better layer caching
# We need both the package's package.json and the root yarn.lock
# Assuming yarn.lock is copied into the context (e.g., manually before build)
COPY package.json yarn.lock ./

# Install dependencies using Yarn
RUN yarn install --frozen-lockfile

# Copy source files (relative to local context)
COPY tsconfig.json ./
COPY src ./src

# Build the package (using the script from package.json)
RUN yarn run build

# Use a smaller image for production
FROM node:18-slim

WORKDIR /app

# Copy necessary files from the builder stage
# package.json and yarn.lock were copied to builder's /app
COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/dist ./dist

# Install production dependencies only using Yarn
RUN yarn install --production --frozen-lockfile

# Command to run the application
CMD ["node", "dist/index.js"]