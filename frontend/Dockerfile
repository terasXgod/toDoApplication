# ЭТАП 1: Сборка (Build)
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ЭТАП 2: Запуск (Run)
FROM nginx:alpine
# Копируем собранные файлы из этапа 1 в папку Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Копируем конфиг
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]