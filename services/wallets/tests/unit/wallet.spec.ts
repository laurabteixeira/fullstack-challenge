import { describe, expect, test } from "bun:test";
import { InvalidAmountError } from "../../src/domain/errors/invalid-amount.error";
import { InsufficientBalanceError } from "../../src/domain/errors/insufficient-balance.error";
import { Wallet } from "../../src/domain/wallet/wallet.entity";

describe("Wallet aggregate", () => {
  test("creates wallet with initial balance", () => {
    const wallet = Wallet.create("w1", "player-1", 1000n);
    expect(wallet.balanceCents).toBe(1000n);
  });

  test("rejects negative initial balance", () => {
    expect(() => Wallet.create("w1", "player-1", -1n)).toThrow(InvalidAmountError);
  });

  test("debits when balance is sufficient", () => {
    const wallet = Wallet.create("w1", "player-1", 1000n);
    wallet.debit(400n);
    expect(wallet.balanceCents).toBe(600n);
  });

  test("rejects debit with insufficient balance", () => {
    const wallet = Wallet.create("w1", "player-1", 100n);
    expect(() => wallet.debit(200n)).toThrow(InsufficientBalanceError);
  });

  test("rejects non-positive debit amount", () => {
    const wallet = Wallet.create("w1", "player-1", 100n);
    expect(() => wallet.debit(0n)).toThrow();
  });

  test("credits balance", () => {
    const wallet = Wallet.create("w1", "player-1", 100n);
    wallet.credit(50n);
    expect(wallet.balanceCents).toBe(150n);
  });
});
