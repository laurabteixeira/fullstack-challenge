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

export function centsFromString(value: string): Cents {
  if (!/^\d+$/.test(value)) {
    throw new Error("Amount must be a non-negative integer string in cents");
  }
  return BigInt(value);
}

export function parsePayoutCents(value: string | number): Cents {
  if (typeof value === "string") {
    return centsFromString(value);
  }
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Payout must be a non-negative integer in cents");
  }
  return BigInt(value);
}
