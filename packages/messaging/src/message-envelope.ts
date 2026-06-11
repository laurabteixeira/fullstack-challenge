import type { DomainEventType } from "./events";
import { isDomainEventType } from "./is-domain-event";

export type MessageEnvelope<TPayload = unknown> = {
  eventType: DomainEventType;
  idempotencyKey: string;
  payload: TPayload;
  publishedAt: string;
};

export function createMessageEnvelope<TPayload>(
  eventType: DomainEventType,
  idempotencyKey: string,
  payload: TPayload,
  publishedAt: string = new Date().toISOString(),
): MessageEnvelope<TPayload> {
  return { eventType, idempotencyKey, payload, publishedAt };
}

export function parseMessageEnvelope<TPayload = unknown>(
  body: string,
): MessageEnvelope<TPayload> {
  const parsed = JSON.parse(body) as MessageEnvelope<TPayload>;

  if (
    typeof parsed.eventType !== "string" ||
    typeof parsed.idempotencyKey !== "string" ||
    typeof parsed.publishedAt !== "string" ||
    !("payload" in parsed)
  ) {
    throw new Error("Invalid message envelope");
  }

  if (!isDomainEventType(parsed.eventType)) {
    throw new Error(`Unknown domain event: ${parsed.eventType}`);
  }

  return parsed;
}
