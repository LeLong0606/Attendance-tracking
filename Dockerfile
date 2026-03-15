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

# dist copy vào đúng subpath để khớp với Vite base /workdaymanagement/ui/
COPY --from=build /app/dist /usr/share/nginx/html/workdaymanagement/ui

# Dùng file config riêng thay vì RUN echo inline
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]