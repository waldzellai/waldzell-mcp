FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .
RUN npm run build

# Run as non-privileged user
USER node

# Define entrypoint
ENTRYPOINT ["node", "dist/index.js"]