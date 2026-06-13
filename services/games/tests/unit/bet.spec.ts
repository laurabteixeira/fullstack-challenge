import { describe, expect, test } from "bun:test";
import { Bet } from "../../src/domain/bet/bet.entity";
import { BET_STATUS } from "../../src/domain/bet/bet-status";

describe("Bet aggregate", () => {
  test("creates pending bet and activates after debit", () => {
    const bet = Bet.createPending({
      id: "bet-1",
      roundId: "round-1",
      playerId: "player-1",
      amountCents: 1000n,
      idempotencyKey: "idem-1",
    });

    expect(bet.status).toBe(BET_STATUS.PENDING);
    bet.activate();
    expect(bet.status).toBe(BET_STATUS.ACTIVE);
  });

  test("cashes out with payout based on multiplier", () => {
    const bet = Bet.createPending({
      id: "bet-2",
      roundId: "round-1",
      playerId: "player-1",
      amountCents: 1000n,
      idempotencyKey: "idem-2",
    });
    bet.activate();
    bet.cashOut(200);

    expect(bet.status).toBe(BET_STATUS.CASHED_OUT);
    expect(bet.payoutCents).toBe(2000n);
  });

  test("marks active bet as lost on crash", () => {
    const bet = Bet.createPending({
      id: "bet-3",
      roundId: "round-1",
      playerId: "player-1",
      amountCents: 1000n,
      idempotencyKey: "idem-3",
    });
    bet.activate();
    bet.markLost();

    expect(bet.status).toBe(BET_STATUS.LOST);
    expect(bet.payoutCents).toBe(0n);
  });
});
