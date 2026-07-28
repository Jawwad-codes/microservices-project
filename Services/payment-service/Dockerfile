FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate --schema=./src/prisma/schema.prisma
RUN npm prune --omit=dev

FROM node:20-bookworm-slim
RUN apt-get update -y && apt-get install -y openssl 
WORKDIR /app
RUN groupadd -r appuser && useradd -r -g appuser appuser

COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/src ./src
COPY --from=builder --chown=appuser:appuser /app/package.json ./


USER appuser

EXPOSE 4004
CMD ["node", "src/server.js"]