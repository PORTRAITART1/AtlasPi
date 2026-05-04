FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copier tous les fichiers frontend
COPY frontend/*.html ./
COPY frontend/*.css ./
COPY frontend/*.js ./
COPY frontend/images ./images/ 2>/dev/null || true

# Copier nginx config si existe
COPY frontend/nginx.conf /etc/nginx/nginx.conf 2>/dev/null || true

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
