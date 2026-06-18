FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html

RUN rm -f /etc/nginx/conf.d/default.conf && printf 'server {\n  listen 8080;\n  listen [::]:8080;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n\n  resolver 8.8.8.8 1.1.1.1 valid=300s;\n  resolver_timeout 5s;\n\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n\n  location /proxy/ {\n    proxy_pass $arg_target;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n    proxy_ssl_server_name on;\n    proxy_ssl_verify off;\n    proxy_set_header User-Agent "imagery-form-crafter/1.0";\n  }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]