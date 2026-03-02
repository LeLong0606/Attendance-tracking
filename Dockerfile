# ==========================================
# STAGE 1: Dùng Node.js để cài thư viện và Build
# ==========================================
FROM node:20-alpine AS build
WORKDIR /app

# Copy file cấu hình và cài đặt thư viện trước (Tận dụng cache của Docker cho nhanh)
COPY package*.json ./
RUN npm install

# Copy toàn bộ source code và chạy lệnh build của Vite (Vite sẽ tạo ra thư mục 'dist')
COPY . .
RUN npm run build

# ==========================================
# STAGE 2: Dùng Nginx để chạy Web tĩnh
# ==========================================
FROM nginx:alpine

# Copy toàn bộ file tĩnh đã build từ Stage 1 sang thư mục gốc của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# [QUAN TRỌNG]: Cấu hình Nginx để hỗ trợ React Router (Fix lỗi 404 khi bấm F5 ở trang con)
RUN echo "server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

# Nginx mặc định chạy ở cổng 80 bên trong container
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]