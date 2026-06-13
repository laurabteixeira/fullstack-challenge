import { MULTIPLIER_SCALE } from "@crash/provably-fair";

export function computeMultiplierAt(
  runningStartedAtMs: number,
  nowMs: number,
  crashPointScaled: number,
  growthPerSecond: number,
): number {
  if (nowMs <= runningStartedAtMs) {
    return MULTIPLIER_SCALE;
  }

  const elapsedSeconds = (nowMs - runningStartedAtMs) / 1000;
  const next = MULTIPLIER_SCALE + elapsedSeconds * growthPerSecond;
  return Math.min(Math.floor(next), crashPointScaled);
}

export function hasReachedCrashPoint(
  currentMultiplierScaled: number,
  crashPointScaled: number,
): boolean {
  return currentMultiplierScaled >= crashPointScaled;
}
