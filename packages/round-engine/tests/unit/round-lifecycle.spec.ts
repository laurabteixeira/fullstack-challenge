import { describe, expect, test } from "bun:test";
import { ROUND_PHASES, RoundLifecycle } from "../../src/index";

const config = {
  bettingDurationMs: 1_000,
  tickIntervalMs: 100,
  multiplierGrowthPerSecond: 500,
  settlingDurationMs: 500,
};

describe("@crash/round-engine", () => {
  test("transitions from betting to running to crash", () => {
    let current = 0;
    const lifecycle = new RoundLifecycle("round-1", 150, config, () => current);

    lifecycle.openBetting();
    expect(lifecycle.snapshot().phase).toBe(ROUND_PHASES.WAITING_BETS);

    current = 1_000;
    expect(lifecycle.shouldStartRunning()).toBe(true);
    lifecycle.startRunning();
    expect(lifecycle.snapshot().phase).toBe(ROUND_PHASES.RUNNING);

    current = 2_000;
    const afterTick = lifecycle.tick();
    expect(afterTick.phase).toBe(ROUND_PHASES.CRASHED);
    expect(afterTick.currentMultiplierScaled).toBe(150);
  });

  test("accepts bets only during betting window", () => {
    let current = 0;
    const lifecycle = new RoundLifecycle("round-2", 500, config, () => current);
    lifecycle.openBetting();

    expect(lifecycle.acceptsBets()).toBe(true);
    current = 1_500;
    expect(lifecycle.acceptsBets()).toBe(false);
  });

  test("cashout multiplier is available only while running", () => {
    let current = 0;
    const lifecycle = new RoundLifecycle("round-3", 1_000, config, () => current);
    lifecycle.openBetting();
    current = 1_000;
    lifecycle.startRunning();
    current = 1_200;
    lifecycle.tick();

    expect(lifecycle.cashoutMultiplier()).toBeGreaterThanOrEqual(100);
    current = 5_000;
    lifecycle.tick();
    expect(() => lifecycle.cashoutMultiplier()).toThrow();
  });

  test("transitions from settling to completed", () => {
    let current = 0;
    const lifecycle = new RoundLifecycle("round-4", 150, config, () => current);

    lifecycle.openBetting();
    current = 1_000;
    lifecycle.startRunning();
    current = 2_000;
    lifecycle.tick();
    lifecycle.beginSettling();

    expect(lifecycle.snapshot().phase).toBe(ROUND_PHASES.SETTLING);

    lifecycle.complete();

    const snapshot = lifecycle.snapshot();
    expect(snapshot.phase).toBe(ROUND_PHASES.COMPLETED);
    expect(snapshot.completedAt).toBe(current);
  });
});
