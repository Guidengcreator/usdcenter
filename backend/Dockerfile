# syntax=docker/dockerfile:1

FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json

RUN npm ci --workspace backend --include-workspace-root=false

COPY backend backend

RUN npm run build -w backend

FROM node:24-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json

RUN npm ci --omit=dev --workspace backend --include-workspace-root=false \
  && npm cache clean --force

COPY --from=build /app/backend/dist backend/dist
COPY backend/drizzle backend/drizzle

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "dist/server.js"]
