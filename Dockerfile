FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copier tous les fichiers frontend
COPY frontend/*.html ./
COPY frontend/*.css ./
COPY frontend/*.js ./
COPY frontend/*.png ./
COPY frontend/validation-key.txt ./
COPY frontend/images ./images/

# Configuration nginx personnalisée
RUN printf '%s\n' \
'server {' \
'    listen 3000;' \
'    root /usr/share/nginx/html;' \
'    index index.html;' \
'' \
'    location = /validation-key.txt {' \
'        default_type text/plain;' \
'        try_files /validation-key.txt =404;' \
'        add_header Cache-Control "no-cache, no-store, must-revalidate";' \
'    }' \
'' \
'    location / {' \
'        try_files $uri $uri/ /index.html;' \
'    }' \
'}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
