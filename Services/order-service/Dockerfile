FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./


RUN npm ci

COPY . .

RUN npx prisma generate --schema=./src/prisma/schema.prisma


RUN npm prune --omit=dev

FROM gcr.io/distroless/nodejs20-debian13:nonroot

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json

EXPOSE 4003

CMD ["src/server.js"]