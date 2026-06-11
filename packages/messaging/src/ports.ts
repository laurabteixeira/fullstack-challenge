import type { DomainEventType } from "./events";

export type MessageHandler<TPayload = unknown> = (
  envelope: {
    eventType: DomainEventType;
    idempotencyKey: string;
    payload: TPayload;
    publishedAt: string;
  },
) => Promise<void>;

export interface MessagePublisher {
  publish<TPayload>(
    eventType: DomainEventType,
    idempotencyKey: string,
    payload: TPayload,
  ): Promise<void>;
}

export interface MessageConsumer {
  register<TPayload>(
    eventType: DomainEventType,
    handler: MessageHandler<TPayload>,
  ): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}
