/** 100 = 1.00x, 250 = 2.50x */
export const MULTIPLIER_SCALE = 100;

export function formatMultiplier(multiplierScaled: number): string {
  return `${(multiplierScaled / MULTIPLIER_SCALE).toFixed(2)}x`;
}

export function parseMultiplierInput(value: string): number {
  const normalized = value.trim().toLowerCase().replace(/x$/, "");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("Invalid multiplier");
  }
  return Math.floor(parsed * MULTIPLIER_SCALE);
}
