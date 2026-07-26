# Use the official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory to the non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Note: GalaChain contracts don't typically run as standalone applications
# This Dockerfile is for packaging the contract for deployment to GalaChain
# The contract will be deployed using GalaChain CLI tools

# Copy package-lock.json if available
COPY package-lock.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm install

# Build the contract
RUN npm run build

# Verify build output
RUN ls -la dist/

# Define a default command (can be overridden during deployment)
CMD ["sh", "-c", "echo 'GalaChain contract built and packaged successfully'"]