export type Cents = bigint;

export const MIN_BET_CENTS = 100n;
export const MAX_BET_CENTS = 100_000n;

export function centsFromNumber(value: number): Cents {
  if (!Number.isInteger(value) || value < 100 || value > 100_000) {
    throw new Error("Bet amount must be between 100 and 100000 cents");
  }

  return BigInt(value);
}

export function payoutFromBet(
  amountCents: Cents,
  multiplierScaled: number,
): Cents {
  return (amountCents * BigInt(multiplierScaled)) / 100n;
}
