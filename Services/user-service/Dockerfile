FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .


RUN npx prisma generate --schema=./src/prisma/schema.prisma
RUN npm prune --omit=dev
FROM gcr.io/distroless/nodejs20-debian12:nonroot
WORKDIR /app

ENV DATABASE_URL=""
ENV PORT=4001
ENV JWT_SECRET=""
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

CMD ["src/server.js"]
