# Multi-stage Dockerfile for AtlasPi Frontend (Render deployment)
# Stage 1: Build stage (if needed)
FROM node:18-alpine AS builder

WORKDIR /app

# Copy frontend files
COPY frontend/ .

# Stage 2: Runtime (Nginx)
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Remove default Nginx config
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy frontend files from builder
COPY --from=builder /app/ .

# Copy Nginx config if exists
COPY frontend/nginx.conf /etc/nginx/nginx.conf 2>/dev/null || true

# Create a basic nginx config if custom one doesn't exist
RUN if [ ! -f /etc/nginx/nginx.conf ]; then \
      echo 'user nginx;\nworker_processes auto;\nerror_log /var/log/nginx/error.log warn;\npid /var/run/nginx.pid;\nevents {\n  worker_connections 1024;\n}\nhttp {\n  include /etc/nginx/mime.types;\n  default_type application/octet-stream;\n  sendfile on;\n  keepalive_timeout 65;\n  server {\n    listen 3000;\n    server_name _;\n    root /usr/share/nginx/html;\n    index index.html;\n    location / {\n      try_files $uri $uri/ /index.html;\n    }\n  }\n}' > /etc/nginx/nginx.conf; \n    fi

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
