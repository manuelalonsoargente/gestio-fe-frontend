# --- Etapa 1: build de l'SPA amb Vite ---
FROM node:20-alpine AS build

WORKDIR /app

# La URL de l'API i la llicència PrimeUI s'injecten en temps de build.
ARG VITE_API_BASE_URL=http://localhost:8080/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG VITE_PRIMEUI_LICENSE=
ENV VITE_PRIMEUI_LICENSE=$VITE_PRIMEUI_LICENSE

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Etapa 2: servici de fitxers estàtics amb Nginx ---
FROM nginx:alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
