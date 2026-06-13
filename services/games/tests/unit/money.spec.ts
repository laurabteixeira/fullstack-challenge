import { describe, expect, test } from "bun:test";
import { centsFromNumber, payoutFromBet } from "../../src/domain/money";

describe("games money helpers", () => {
  test("validates bet amount range in cents", () => {
    expect(centsFromNumber(100)).toBe(100n);
    expect(centsFromNumber(100_000)).toBe(100_000n);
    expect(() => centsFromNumber(50)).toThrow();
    expect(() => centsFromNumber(100_001)).toThrow();
  });

  test("calculates payout from multiplier scale", () => {
    expect(payoutFromBet(1000n, 150)).toBe(1500n);
    expect(payoutFromBet(1000n, 200)).toBe(2000n);
  });
});
