# syntax=docker/dockerfile:1.4
# ==========================================
# STAGE 1: Build FE (Vite)
# ==========================================
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ==========================================
# STAGE 2: Nginx serve + reverse proxy API
# ==========================================
FROM nginx:alpine

# dist copy vào root html dir, nginx rewrite sẽ strip prefix /workdaymanagement/ui
COPY --from=build /app/dist /usr/share/nginx/html

# Nhúng trực tiếp nginx config vào Dockerfile
RUN cat > /etc/nginx/conf.d/default.conf <<'NGINX'
server {
	listen 80;
	listen 443 ssl;

	server_name desktop-8l98oc0.tail542363.ts.net;

	ssl_certificate     /https/desktop-8l98oc0.tail542363.ts.net.crt;
	ssl_certificate_key /https/desktop-8l98oc0.tail542363.ts.net.key;

	# =========================
	# FRONTEND SPA
	# =========================
	location = /workdaymanagement/ui {
		return 301 /workdaymanagement/ui/;
	}

	location /workdaymanagement/ui/ {
		alias /usr/share/nginx/html/;
		index index.html;
		try_files $uri $uri/ /index.html;
	}

	# =========================
	# BACKEND API PROXY
	# Forward dung proto de Kestrel khong 307 ve 8081
	# =========================
	location /workdaymanagement/api/ {
		proxy_pass         http://host.docker.internal:8081/workdaymanagement/api/;
		proxy_http_version 1.1;
		proxy_redirect     off;

		proxy_set_header Host               $host;
		proxy_set_header X-Real-IP          $remote_addr;
		proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto  https;
		proxy_set_header X-Forwarded-Host   $host;
		proxy_set_header X-Forwarded-Port   443;
	}
}
NGINX

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]