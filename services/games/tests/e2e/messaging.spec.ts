import { describe, expect, test } from 'bun:test';
import {
  DOMAIN_EVENTS,
  createSqsClient,
  loadSqsConfigFromEnv,
  sendEnvelope,
} from '@crash/messaging';
import { receiveEnvelopeByIdempotencyKey } from '../../../../packages/messaging/tests/helpers/receive-envelope-by-idempotency-key';

const LOCALSTACK_ENDPOINT =
  process.env.AWS_E2E_ENDPOINT_URL ?? 'http://localhost:4566';

async function isLocalstackReachable(): Promise<boolean> {
  try {
    const response = await fetch(`${LOCALSTACK_ENDPOINT}/_localstack/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

describe('messaging e2e', () => {
  test('publish and receive envelope via LocalStack', async () => {
    if (!(await isLocalstackReachable())) {
      console.warn('LocalStack not reachable — skipping integration test');
      return;
    }

    const config = loadSqsConfigFromEnv({
      AWS_REGION: process.env.AWS_REGION ?? 'us-east-1',
      AWS_ENDPOINT_URL: LOCALSTACK_ENDPOINT,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? 'test',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
    });

    const client = createSqsClient(config);
    const idempotencyKey = `e2e-${Date.now()}`;
    const payload = { test: true, betId: 'bet-e2e' };

    await sendEnvelope(
      client,
      DOMAIN_EVENTS.BET_DEBITED,
      idempotencyKey,
      payload,
    );

    const received = await receiveEnvelopeByIdempotencyKey(
      client,
      DOMAIN_EVENTS.BET_DEBITED,
      idempotencyKey,
      { maxAttempts: 15, waitSeconds: 2 },
    );

    expect(received).not.toBeNull();
    expect(received!.idempotencyKey).toBe(idempotencyKey);
    expect(received!.eventType).toBe(DOMAIN_EVENTS.BET_DEBITED);
    expect(received!.payload).toEqual(payload);
  }, 30000);
});
