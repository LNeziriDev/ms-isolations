# Frontend (Vite + React) container

# Build stage: compile the SPA into static assets
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Allow overriding the gateway URL at build time (wired from compose)
ARG VITE_GATEWAY_URL=
ENV VITE_GATEWAY_URL=${VITE_GATEWAY_URL}
RUN npm run build

# Runtime stage: serve static assets with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


