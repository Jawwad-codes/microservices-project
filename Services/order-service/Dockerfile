FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate --schema=./src/prisma/schema.prisma

RUN npm prune --omit=dev

FROM node:20-bookworm-slim

WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl 
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json

RUN groupadd -r appuser && useradd -r -g appuser appuser

USER appuser

EXPOSE 4003

CMD ["node", "src/server.js"]