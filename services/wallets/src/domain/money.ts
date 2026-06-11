export type Cents = bigint;

export function assertPositiveCents(amount: Cents): void {
  if (amount <= 0n) {
    throw new Error("Amount must be positive");
  }
}

export function centsFromNumber(value: number): Cents {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Amount must be a positive integer in cents");
  }
  return BigInt(value);
}
