FROM oven/bun:1-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY package.json bun.lock ./
COPY packages/messaging/package.json packages/messaging/
COPY services/wallets/package.json services/wallets/
RUN bun install

COPY packages/messaging packages/messaging
COPY services/wallets services/wallets

WORKDIR /app/services/wallets

EXPOSE 4002

CMD ["bun", "run", "src/main.ts"]
