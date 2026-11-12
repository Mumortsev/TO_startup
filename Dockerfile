FROM node:22-bookworm-slim AS build
RUN apt-get update && apt-get install --no-install-recommends -y git ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG SITE_URL=https://artmusiclazarevskoe.ru
ENV SITE_BASE_PATH=/ SITE_URL=${SITE_URL} VITE_SITE_URL=${SITE_URL}
RUN npm run build:production

FROM nginx:1.28-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
