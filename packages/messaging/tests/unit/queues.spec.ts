import { describe, expect, test } from "bun:test";
import { DOMAIN_EVENTS } from "../../src/events";
import { InMemoryIdempotencyStore } from "../../src/idempotency-store";
import { isDomainEventType } from "../../src/is-domain-event";
import { QUEUE_NAMES, queueNameForEvent } from "../../src/queues";
import {
  createMessageEnvelope,
  parseMessageEnvelope,
} from "../../src/message-envelope";

describe("@crash/messaging queues", () => {
  test("maps each domain event to a crash-prefixed queue", () => {
    expect(queueNameForEvent(DOMAIN_EVENTS.BET_DEBIT_REQUESTED)).toBe(
      "crash-bet-debit-requested",
    );
    expect(QUEUE_NAMES[DOMAIN_EVENTS.ROUND_SETTLEMENT_DONE]).toBe(
      "crash-round-settlement-done",
    );
  });

  test("creates and parses message envelope", () => {
    const envelope = createMessageEnvelope(
      DOMAIN_EVENTS.BET_DEBITED,
      "idem-1",
      { betId: "bet-1" },
      "2026-06-11T00:00:00.000Z",
    );

    const parsed = parseMessageEnvelope(
      JSON.stringify(envelope),
    ) as typeof envelope;

    expect(parsed).toEqual(envelope);
  });

  test("rejects invalid envelope", () => {
    expect(() => parseMessageEnvelope('{"foo":"bar"}')).toThrow(
      "Invalid message envelope",
    );
  });

  test("rejects unknown eventType", () => {
    expect(() =>
      parseMessageEnvelope(
        JSON.stringify({
          eventType: "unknown.event",
          idempotencyKey: "k",
          publishedAt: "2026-06-11T00:00:00.000Z",
          payload: {},
        }),
      ),
    ).toThrow("Unknown domain event: unknown.event");
  });

  test("isDomainEventType validates canonical events", () => {
    expect(isDomainEventType(DOMAIN_EVENTS.BET_DEBITED)).toBe(true);
    expect(isDomainEventType("not.an.event")).toBe(false);
  });
});

describe("@crash/messaging idempotency", () => {
  test("InMemoryIdempotencyStore tracks processed keys", () => {
    const store = new InMemoryIdempotencyStore();

    expect(store.has("key-1")).toBe(false);
    store.mark("key-1");
    expect(store.has("key-1")).toBe(true);
  });
});
