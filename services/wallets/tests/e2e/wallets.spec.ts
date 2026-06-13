import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  DOMAIN_EVENTS,
  createSqsClient,
  loadSqsConfigFromEnv,
  sendEnvelope,
  type SQSClient,
} from "@crash/messaging";
import {
  cleanupWalletsForPlayer,
  getPlayerIdFromAccessToken,
} from "./wallets-e2e-db";

const KONG_BASE_URL = process.env.KONG_BASE_URL ?? "http://localhost:8000";
const KEYCLOAK_BASE_URL = process.env.KEYCLOAK_BASE_URL ?? "http://localhost:8080";
const LOCALSTACK_ENDPOINT =
  process.env.AWS_E2E_ENDPOINT_URL ?? "http://localhost:4566";

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

async function cleanupTestPlayerWallet(): Promise<void> {
  const token = await getAccessToken();
  await cleanupWalletsForPlayer(getPlayerIdFromAccessToken(token));
}

function createSqsClientForE2e(): SQSClient {
  return createSqsClient(
    loadSqsConfigFromEnv({
      AWS_REGION: process.env.AWS_REGION ?? "us-east-1",
      AWS_ENDPOINT_URL: LOCALSTACK_ENDPOINT,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? "test",
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
    }),
  );
}

async function pollUntil<T>(
  label: string,
  fn: () => Promise<T | null>,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 60_000;
  const intervalMs = options.intervalMs ?? 500;
  const deadline = Date.now() + timeoutMs;
  let lastHint = "unknown";

  while (Date.now() < deadline) {
    const value = await fn();
    if (value !== null) {
      return value;
    }
    await Bun.sleep(intervalMs);
  }

  throw new Error(`${label} not reached within ${timeoutMs}ms (last: ${lastHint})`);
}

async function getWalletBalance(token: string): Promise<string | null> {
  const response = await fetch(`${KONG_BASE_URL}/wallets/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as { balanceCents: string };
  return body.balanceCents;
}

async function ensureWalletExists(token: string): Promise<void> {
  const createResponse = await fetch(`${KONG_BASE_URL}/wallets`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  expect([201, 409]).toContain(createResponse.status);
}

async function pollWalletBalance(
  token: string,
  expectedCents: string,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<string> {
  return pollUntil(
    `balance ${expectedCents}`,
    async () => {
      const balance = await getWalletBalance(token);
      return balance === expectedCents ? balance : null;
    },
    options,
  );
}

async function debitWalletViaSqs(
  client: SQSClient,
  playerId: string,
  amount: number,
): Promise<{ betId: string; idempotencyKey: string }> {
  const idempotencyKey = `wallet-e2e-debit-${Date.now()}`;
  const betId = `bet-e2e-${Date.now()}`;

  await sendEnvelope(client, DOMAIN_EVENTS.BET_DEBIT_REQUESTED, idempotencyKey, {
    betId,
    playerId,
    amount,
    idempotencyKey,
  });

  return { betId, idempotencyKey };
}

/** Ensures wallet exists and balance is debited to 99000 (from 100000). */
async function ensureDebitedWallet(
  token: string,
  playerId: string,
  client: SQSClient,
): Promise<string> {
  const current = await getWalletBalance(token);
  if (current === "99000") {
    return current;
  }

  if (current === null) {
    await ensureWalletExists(token);
  } else if (current !== "100000") {
    await cleanupWalletsForPlayer(playerId);
    await ensureWalletExists(token);
  }

  await pollWalletBalance(token, "100000", { timeoutMs: 15_000, intervalMs: 200 });

  await debitWalletViaSqs(client, playerId, 1000);
  return pollWalletBalance(token, "99000", { timeoutMs: 60_000, intervalMs: 300 });
}

describe.serial("wallets e2e", () => {
  beforeAll(async () => {
    keycloakReachable = await isKeycloakReachable();
    if (!keycloakReachable) {
      console.warn("Keycloak not reachable — skipping wallets e2e");
      return;
    }

    await cleanupTestPlayerWallet();
  });

  afterAll(async () => {
    if (!keycloakReachable) {
      return;
    }

    await cleanupTestPlayerWallet();
  });

  test("creates wallet and returns balance via Kong", async () => {
    if (!keycloakReachable) {
      return;
    }

    const token = await getAccessToken();
    const playerId = getPlayerIdFromAccessToken(token);
    await cleanupWalletsForPlayer(playerId);

    const createResponse = await fetch(`${KONG_BASE_URL}/wallets`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as {
      id: string;
      playerId: string;
      balanceCents: string;
    };
    expect(created.balanceCents).toBe("100000");

    const balance = await getWalletBalance(token);
    expect(balance).toBe("100000");
  }, 30000);

  test("debits wallet via bet.debit_requested", async () => {
    if (!keycloakReachable) {
      return;
    }

    const token = await getAccessToken();
    const playerId = getPlayerIdFromAccessToken(token);
    const client = createSqsClientForE2e();

    const balanceCents = await ensureDebitedWallet(token, playerId, client);
    expect(balanceCents).toBe("99000");
  }, 60000);

  test("credits payout via round.settled", async () => {
    if (!keycloakReachable) {
      return;
    }

    const token = await getAccessToken();
    const playerId = getPlayerIdFromAccessToken(token);
    const client = createSqsClientForE2e();

    const debitedBalance = await ensureDebitedWallet(token, playerId, client);
    expect(debitedBalance).toBe("99000");

    const settlementBetId = `bet-e2e-settle-${Date.now()}`;
    const balanceBeforeSettle = debitedBalance;

    const roundId = `round-e2e-${Date.now()}`;
    const settlementKey = `round-settle-${roundId}`;
    await sendEnvelope(client, DOMAIN_EVENTS.ROUND_SETTLED, settlementKey, {
      roundId,
      idempotencyKey: settlementKey,
      results: [
        {
          betId: settlementBetId,
          playerId,
          payoutCents: "1500",
        },
      ],
    });

    const finalBalance = await pollUntil(
      "settlement credit",
      async () => {
        const balance = await getWalletBalance(token);
        if (balance === null) {
          return null;
        }
        return BigInt(balance) > BigInt(balanceBeforeSettle) ? balance : null;
      },
      { timeoutMs: 15_000, intervalMs: 300 },
    );

    expect(BigInt(finalBalance) - BigInt(balanceBeforeSettle)).toBe(1500n);
  }, 60000);
});
