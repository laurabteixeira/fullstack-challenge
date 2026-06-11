import { describe, expect, test } from 'bun:test';

const KONG_BASE_URL = process.env.KONG_BASE_URL ?? 'http://localhost:8000';

describe('games e2e', () => {
  test('smoke: games health via Kong', async () => {
    const response = await fetch(`${KONG_BASE_URL}/games/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', service: 'games' });
  });

  test('smoke: wallets health via Kong', async () => {
    const response = await fetch(`${KONG_BASE_URL}/wallets/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', service: 'wallets' });
  });
});
