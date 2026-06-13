import { PrismaClient } from "../../src/generated/prisma";

export function getWalletsE2eDatabaseUrl(): string {
  const url =
    process.env.WALLET_E2E_DATABASE_URL ??
    process.env.DATABASE_URL ??
    "postgresql://admin:admin@localhost:5432/wallets";

  return url.replace("@postgres:", "@localhost:");
}

export function getPlayerIdFromAccessToken(token: string): string {
  const payloadSegment = token.split(".")[1];
  if (!payloadSegment) {
    throw new Error("Invalid access token");
  }

  const payload = JSON.parse(
    Buffer.from(payloadSegment, "base64url").toString("utf8"),
  ) as { sub?: string };

  if (typeof payload.sub !== "string") {
    throw new Error("Access token missing sub claim");
  }

  return payload.sub;
}

export async function cleanupWalletsForPlayer(playerId: string): Promise<void> {
  const prisma = new PrismaClient({
    datasources: { db: { url: getWalletsE2eDatabaseUrl() } },
  });

  try {
    await prisma.walletTransaction.deleteMany({
      where: { wallet: { playerId } },
    });
    await prisma.wallet.deleteMany({ where: { playerId } });
  } finally {
    await prisma.$disconnect();
  }
}
