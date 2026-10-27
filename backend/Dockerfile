FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++ gcc

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

FROM node:22-alpine

WORKDIR /app

# runtime dependencies for better-sqlite3
RUN apk add --no-cache libstdc++

COPY --from=builder /app /app

EXPOSE 4000

ENV PORT=4000
ENV NODE_ENV=production

# Persist database folder
VOLUME ["/app/data"]

CMD ["node", "src/server.js"]
