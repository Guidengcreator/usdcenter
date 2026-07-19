# syntax=docker/dockerfile:1

FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json

RUN npm ci --workspace frontend --include-workspace-root=false

COPY frontend frontend

ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build -w frontend

FROM caddy:2-alpine

COPY frontend/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/frontend/dist /srv

EXPOSE 80 443
