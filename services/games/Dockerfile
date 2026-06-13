FROM oven/bun:1-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY package.json bun.lock ./
COPY packages/messaging/package.json packages/messaging/
COPY packages/provably-fair/package.json packages/provably-fair/
COPY packages/round-engine/package.json packages/round-engine/
COPY services/games/package.json services/games/
RUN bun install --ignore-scripts

COPY packages/messaging packages/messaging
COPY packages/provably-fair packages/provably-fair
COPY packages/round-engine packages/round-engine
COPY services/games services/games

WORKDIR /app/services/games

RUN bunx prisma generate

EXPOSE 4001

CMD ["sh", "-c", "bunx prisma migrate deploy && bun run src/main.ts"]
