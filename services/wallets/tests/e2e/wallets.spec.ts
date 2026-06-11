import { describe, expect, test } from "bun:test";
import {
  DOMAIN_EVENTS,
  createSqsClient,
  loadSqsConfigFromEnv,
  receiveOneMessage,
  sendEnvelope,
} from "@crash/messaging";

const KONG_BASE_URL = process.env.KONG_BASE_URL ?? "http://localhost:8000";
const KEYCLOAK_BASE_URL = process.env.KEYCLOAK_BASE_URL ?? "http://localhost:8080";
const LOCALSTACK_ENDPOINT =
  process.env.AWS_ENDPOINT_URL ?? "http://localhost:4566";

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

describe.serial("wallets e2e", () => {
  test("creates wallet and returns balance via Kong", async () => {
    if (!(await isKeycloakReachable())) {
      console.warn("Keycloak not reachable — skipping wallets e2e");
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
    if (!(await isKeycloakReachable())) {
      console.warn("Keycloak not reachable — skipping wallets e2e");
      return;
    }

    const token = await getAccessToken();
    await fetch(`${KONG_BASE_URL}/wallets`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const meResponse = await fetch(`${KONG_BASE_URL}/wallets/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = (await meResponse.json()) as { playerId: string };

    const config = loadSqsConfigFromEnv({
      AWS_REGION: process.env.AWS_REGION ?? "us-east-1",
      AWS_ENDPOINT_URL: LOCALSTACK_ENDPOINT,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? "test",
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
    });
    const client = createSqsClient(config);
    const idempotencyKey = `wallet-e2e-${Date.now()}`;

    await sendEnvelope(
      client,
      DOMAIN_EVENTS.BET_DEBIT_REQUESTED,
      idempotencyKey,
      {
        betId: "bet-e2e-1",
        playerId: me.playerId,
        amount: 1000,
        idempotencyKey,
      },
    );

    let received = null;
    for (let attempt = 0; attempt < 15; attempt++) {
      received = await receiveOneMessage(client, DOMAIN_EVENTS.BET_DEBITED, {
        waitSeconds: 2,
      });
      if (received?.idempotencyKey === idempotencyKey) {
        break;
      }
      await Bun.sleep(1000);
    }

    expect(received).not.toBeNull();
    expect(received!.eventType).toBe(DOMAIN_EVENTS.BET_DEBITED);

    const balanceResponse = await fetch(`${KONG_BASE_URL}/wallets/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const balance = (await balanceResponse.json()) as { balanceCents: string };
    expect(balance.balanceCents).toBe("99000");
  }, 60000);
});
