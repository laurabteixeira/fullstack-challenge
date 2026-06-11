import { Injectable } from "@nestjs/common";
import {
  type DomainEventType,
  type MessagePublisher,
  createSqsClient,
  loadSqsConfigFromEnv,
  sendEnvelope,
} from "@crash/messaging";
import type { SQSClient } from "@aws-sdk/client-sqs";

@Injectable()
export class SqsPublisherAdapter implements MessagePublisher {
  private readonly client: SQSClient;

  constructor() {
    this.client = createSqsClient(loadSqsConfigFromEnv());
  }

  async publish<TPayload>(
    eventType: DomainEventType,
    idempotencyKey: string,
    payload: TPayload,
  ): Promise<void> {
    await sendEnvelope(this.client, eventType, idempotencyKey, payload);
  }
}
