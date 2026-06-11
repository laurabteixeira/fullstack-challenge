FROM oven/bun:1-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY package.json bun.lock ./
COPY packages/messaging/package.json packages/messaging/
COPY services/games/package.json services/games/
RUN bun install

COPY packages/messaging packages/messaging
COPY services/games services/games

WORKDIR /app/services/games

EXPOSE 4001

CMD ["bun", "run", "src/main.ts"]
