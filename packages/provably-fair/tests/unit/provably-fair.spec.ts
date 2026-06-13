import { describe, expect, test } from "bun:test";
import {
  deriveCrashPointScaled,
  generateServerSeed,
  hashServerSeed,
  verifyCrashPoint,
} from "../../src/index";

describe("@crash/provably-fair", () => {
  test("hashServerSeed is deterministic", () => {
    const seed = "abc123";
    expect(hashServerSeed(seed)).toBe(hashServerSeed(seed));
  });

  test("deriveCrashPointScaled is deterministic for same inputs", () => {
    const input = {
      serverSeed: "server-seed",
      clientSeed: "client-seed",
      roundId: "round-1",
    };

    const first = deriveCrashPointScaled(input);
    const second = deriveCrashPointScaled(input);

    expect(first).toBe(second);
    expect(first).toBeGreaterThanOrEqual(100);
  });

  test("verifyCrashPoint accepts valid round data", () => {
    const serverSeed = generateServerSeed();
    const seedHash = hashServerSeed(serverSeed);
    const clientSeed = "public-client-seed";
    const roundId = "round-verify-1";
    const crashPointScaled = deriveCrashPointScaled({
      serverSeed,
      clientSeed,
      roundId,
    });

    expect(
      verifyCrashPoint({
        serverSeed,
        seedHash,
        clientSeed,
        roundId,
        crashPointScaled,
      }),
    ).toBe(true);
  });

  test("verifyCrashPoint rejects tampered crash point", () => {
    const serverSeed = generateServerSeed();
    const seedHash = hashServerSeed(serverSeed);

    expect(
      verifyCrashPoint({
        serverSeed,
        seedHash,
        clientSeed: "client",
        roundId: "round-1",
        crashPointScaled: 999_999,
      }),
    ).toBe(false);
  });
});
