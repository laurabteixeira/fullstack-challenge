import { createHmac } from "node:crypto";
import { MULTIPLIER_SCALE } from "./multiplier";
import { hashServerSeed } from "./seed";

export type ProvablyFairInput = {
  serverSeed: string;
  clientSeed: string;
  roundId: string;
  houseEdgePercent?: number;
};

export type VerifyCrashPointInput = ProvablyFairInput & {
  seedHash: string;
  crashPointScaled: number;
};

export function buildRoundHmac(
  serverSeed: string,
  clientSeed: string,
  roundId: string,
): string {
  return createHmac("sha256", serverSeed)
    .update(`${clientSeed}:${roundId}`)
    .digest("hex");
}

export function crashPointFromHmac(
  hmacHex: string,
  houseEdgePercent = 1,
): number {
  const h = Number.parseInt(hmacHex.slice(0, 8), 16);
  const e = 0x1_0000_0000;

  if (h % 33 === 0) {
    return MULTIPLIER_SCALE;
  }

  const edgeFactor = (100 - houseEdgePercent) / 100;
  const multiplier = (edgeFactor * e) / (e - h);
  return Math.max(MULTIPLIER_SCALE, Math.floor(multiplier * MULTIPLIER_SCALE));
}

export function deriveCrashPointScaled(input: ProvablyFairInput): number {
  const hmac = buildRoundHmac(
    input.serverSeed,
    input.clientSeed,
    input.roundId,
  );
  return crashPointFromHmac(hmac, input.houseEdgePercent ?? 1);
}

export function verifyCrashPoint(input: VerifyCrashPointInput): boolean {
  if (hashServerSeed(input.serverSeed) !== input.seedHash) {
    return false;
  }

  const expected = deriveCrashPointScaled(input);
  return expected === input.crashPointScaled;
}
