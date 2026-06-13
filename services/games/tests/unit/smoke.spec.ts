import { describe, expect, test } from "bun:test";
import { deriveCrashPointScaled, hashServerSeed } from "@crash/provably-fair";
import { ROUND_PHASES } from "@crash/round-engine";

describe("games service", () => {
  test("smoke: sdk integration available", () => {
    const serverSeed = "seed";
    const crashPoint = deriveCrashPointScaled({
      serverSeed,
      clientSeed: "client",
      roundId: "round-smoke",
    });

    expect(hashServerSeed(serverSeed)).toHaveLength(64);
    expect(crashPoint).toBeGreaterThanOrEqual(100);
    expect(ROUND_PHASES.WAITING_BETS).toBe("WAITING_BETS");
  });
});
