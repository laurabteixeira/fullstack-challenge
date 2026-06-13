import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  cleanupWalletsForPlayer,
  getPlayerIdFromAccessToken,
} from "../../../wallets/tests/e2e/wallets-e2e-db";

const KONG_BASE_URL = process.env.KONG_BASE_URL ?? "http://localhost:8000";
const KEYCLOAK_BASE_URL =
  process.env.KEYCLOAK_BASE_URL ?? "http://localhost:8080";

const BET_AMOUNT_CENTS = 1000;
const INITIAL_BALANCE_CENTS = "100000";
const MAX_ROUND_ATTEMPTS = 5;

type RoundResponse = {
  phase: string;
};

type BetResponse = {
  status: string;
  payoutCents: string | null;
};

let keycloakReachable = false;

async function isKeycloakReachable(): Promise<boolean> {
  try {
    const response = await fetch(`${KEYCLOAK_BASE_URL}/realms/crash-game`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function getAccessToken(): Promise<string> {
  const response = await fetch(
    `${KEYCLOAK_BASE_URL}/realms/crash-game/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: "crash-game-client",
        username: "player",
        password: "player123",
      }),
    },
  );

  expect(response.status).toBe(200);
  const body = (await response.json()) as { access_token: string };
  return body.access_token;
}

async function getWalletBalance(token: string): Promise<string> {
  const response = await fetch(`${KONG_BASE_URL}/wallets/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status).toBe(200);
  const body = (await response.json()) as { balanceCents: string };
  return body.balanceCents;
}

async function pollUntil<T>(
  label: string,
  fn: () => Promise<T | null>,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<T | null> {
  const timeoutMs = options.timeoutMs ?? 90_000;
  const intervalMs = options.intervalMs ?? 200;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const value = await fn();
    if (value !== null) {
      return value;
    }
    await Bun.sleep(intervalMs);
  }

  return null;
}

describe.serial("gameplay e2e", () => {
  beforeAll(async () => {
    keycloakReachable = await isKeycloakReachable();
    if (!keycloakReachable) {
      console.warn("Keycloak not reachable — skipping gameplay e2e");
      return;
    }

    const token = await getAccessToken();
    await cleanupWalletsForPlayer(getPlayerIdFromAccessToken(token));
  });

  afterAll(async () => {
    if (!keycloakReachable) {
      return;
    }

    const token = await getAccessToken();
    await cleanupWalletsForPlayer(getPlayerIdFromAccessToken(token));
  });

  test("bet → debit → cashout via Kong", async () => {
    if (!keycloakReachable) {
      return;
    }

    const token = await getAccessToken();

    await fetch(`${KONG_BASE_URL}/wallets`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(await getWalletBalance(token)).toBe(INITIAL_BALANCE_CENTS);

    let cashedOut: BetResponse | null = null;

    for (let attempt = 0; attempt < MAX_ROUND_ATTEMPTS; attempt++) {
      const bettingRound = await pollUntil("betting phase", async () => {
        const response = await fetch(`${KONG_BASE_URL}/games/rounds/current`);
        if (!response.ok) {
          return null;
        }
        const round = (await response.json()) as RoundResponse;
        return round.phase === "WAITING_BETS" ? round : null;
      }, { timeoutMs: 30_000, intervalMs: 200 });

      if (!bettingRound) {
        continue;
      }

      const betResponse = await fetch(`${KONG_BASE_URL}/games/bet`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: BET_AMOUNT_CENTS }),
      });

      if (betResponse.status === 409) {
        continue;
      }
      expect(betResponse.status).toBe(201);

      await pollUntil("wallet debit", async () => {
        const balance = await getWalletBalance(token);
        const expected = String(Number(INITIAL_BALANCE_CENTS) - BET_AMOUNT_CENTS);
        return balance === expected ? balance : null;
      }, { timeoutMs: 15_000, intervalMs: 200 });

      const activeBet = await pollUntil("active bet", async () => {
        const response = await fetch(`${KONG_BASE_URL}/games/bets/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          return null;
        }
        const bets = (await response.json()) as BetResponse[];
        return bets.find((bet) => bet.status === "ACTIVE") ?? null;
      }, { timeoutMs: 15_000, intervalMs: 200 });

      if (!activeBet) {
        continue;
      }

      const running = await pollUntil("running phase", async () => {
        const response = await fetch(`${KONG_BASE_URL}/games/rounds/current`);
        if (!response.ok) {
          return null;
        }
        const round = (await response.json()) as RoundResponse;
        return round.phase === "RUNNING" ? round : null;
      }, { timeoutMs: 15_000, intervalMs: 100 });

      if (!running) {
        continue;
      }

      const cashoutResponse = await fetch(`${KONG_BASE_URL}/games/bet/cashout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (cashoutResponse.status === 201) {
        cashedOut = (await cashoutResponse.json()) as BetResponse;
        break;
      }
    }

    expect(cashedOut).not.toBeNull();
    expect(cashedOut!.status).toBe("CASHED_OUT");
    expect(cashedOut!.payoutCents).not.toBeNull();
    expect(BigInt(cashedOut!.payoutCents!)).toBeGreaterThan(0n);
  }, 120_000);
});
