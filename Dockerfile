# ==========================================
# STAGE 1: Dùng Node.js để cài thư viện và Build (Cho Attendance Tracking)
# ==========================================
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Lưu ý: Vite mặc định build ra thư mục 'dist'
RUN npm run build

# ==========================================
# STAGE 2: Dùng Nginx để chạy Web tĩnh
# ==========================================
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# [QUAN TRỌNG]: Cấu hình Nginx HTTPS với chứng chỉ xịn của Tailscale
RUN echo "server { \
    listen 80; \
    listen 443 ssl; \
    ssl_certificate /https/desktop-8l98oc0.tail542363.ts.net.crt; \
    ssl_certificate_key /https/desktop-8l98oc0.tail542363.ts.net.key; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
        return 302 /management/ui/; \
    } \
      location / { \
        return 302 /management/ui/; \
    } \
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]