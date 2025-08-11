# Products service container
FROM node:18

# Working directory inside the container
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --production

# Copy application code and seed data
COPY src ./src
COPY seed.js ./
COPY data ./data

# Expose service port
EXPOSE 3000

# Start the service (includes DB init + auto-seed)
CMD ["node", "src/index.js"]
