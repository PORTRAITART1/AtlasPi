FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copier tous les fichiers frontend
COPY frontend/*.html ./
COPY frontend/*.css ./
COPY frontend/*.js ./

# Copier images si le dossier existe
COPY frontend/images ./images/ || true

# Configuration nginx personnalisée
RUN echo 'server { listen 3000; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
