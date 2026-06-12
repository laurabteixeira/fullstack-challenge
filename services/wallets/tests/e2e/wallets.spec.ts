import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  DOMAIN_EVENTS,
  createSqsClient,
  loadSqsConfigFromEnv,
  sendEnvelope,
} from "@crash/messaging";
import { receiveEnvelopeByIdempotencyKey } from "../../../../packages/messaging/tests/helpers/receive-envelope-by-idempotency-key";
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

    const meResponse = await fetch(`${KONG_BASE_URL}/wallets/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(meResponse.status).toBe(200);
    const me = (await meResponse.json()) as { balanceCents: string };
    expect(me.balanceCents).toBe("100000");
  }, 30000);

  test("debits wallet via bet.debit_requested and publishes bet.debited", async () => {
    if (!keycloakReachable) {
      return;
    }

    const token = await getAccessToken();
    await fetch(`${KONG_BASE_URL}/wallets`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const meBeforeResponse = await fetch(`${KONG_BASE_URL}/wallets/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(meBeforeResponse.status).toBe(200);
    const meBefore = (await meBeforeResponse.json()) as {
      playerId: string;
      balanceCents: string;
    };
    expect(meBefore.balanceCents).toBe("100000");

    const config = loadSqsConfigFromEnv({
      AWS_REGION: process.env.AWS_REGION ?? "us-east-1",
      AWS_ENDPOINT_URL: LOCALSTACK_ENDPOINT,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? "test",
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
    });
    const client = createSqsClient(config);
    const idempotencyKey = `wallet-e2e-${Date.now()}`;
    const betId = `bet-e2e-${Date.now()}`;

    await sendEnvelope(
      client,
      DOMAIN_EVENTS.BET_DEBIT_REQUESTED,
      idempotencyKey,
      {
        betId,
        playerId: meBefore.playerId,
        amount: 1000,
        idempotencyKey,
      },
    );

    const received = await receiveEnvelopeByIdempotencyKey(
      client,
      DOMAIN_EVENTS.BET_DEBITED,
      idempotencyKey,
      { maxAttempts: 15, waitSeconds: 2, sleepMs: 1000 },
    );

    expect(received).not.toBeNull();
    expect(received!.eventType).toBe(DOMAIN_EVENTS.BET_DEBITED);

    const balanceResponse = await fetch(`${KONG_BASE_URL}/wallets/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const balance = (await balanceResponse.json()) as { balanceCents: string };
    expect(balance.balanceCents).toBe("99000");
  }, 60000);
});
