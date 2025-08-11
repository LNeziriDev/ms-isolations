# Gateway service container
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Install production dependencies only for smaller image
COPY package*.json ./
RUN npm install --production

# Copy source files
COPY src ./src

# Expose HTTP port
EXPOSE 3000

# Start the gateway
CMD ["node", "src/index.js"]
