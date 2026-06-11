import type { DomainEventType, MessagePublisher } from "@crash/messaging";

export class FakeMessagePublisher implements MessagePublisher {
  readonly published: Array<{
    eventType: DomainEventType;
    idempotencyKey: string;
    payload: unknown;
  }> = [];

  async publish<TPayload>(
    eventType: DomainEventType,
    idempotencyKey: string,
    payload: TPayload,
  ): Promise<void> {
    this.published.push({ eventType, idempotencyKey, payload });
  }
}
