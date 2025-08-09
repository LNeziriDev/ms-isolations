FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY src ./src
COPY seed.js ./
COPY data ./data
EXPOSE 3000
CMD ["node", "src/index.js"]
