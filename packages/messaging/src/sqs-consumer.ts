import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  type SQSClient,
} from "@aws-sdk/client-sqs";
import type { DomainEventType } from "./events";
import {
  InMemoryIdempotencyStore,
  type IdempotencyStore,
} from "./idempotency-store";
import { parseMessageEnvelope } from "./message-envelope";
import type { MessageConsumer, MessageHandler } from "./ports";
import { queueNameForEvent } from "./queues";
import { createSqsClient, getQueueUrl } from "./sqs-client";
import { loadSqsConfigFromEnv, type SqsConfig } from "./sqs-config";

export type SqsConsumerErrorHandler = (
  error: unknown,
  context: { eventType: DomainEventType; idempotencyKey?: string },
) => void;

export class SqsMessageConsumer implements MessageConsumer {
  private readonly client: SQSClient;
  private readonly handlers = new Map<DomainEventType, MessageHandler>();
  private readonly queueUrlCache = new Map<string, string>();
  private readonly idempotencyStore: IdempotencyStore;
  private readonly onError: SqsConsumerErrorHandler;
  private running = false;
  private pollPromise: Promise<void> | null = null;

  constructor(
    config?: SqsConfig,
    idempotencyStore?: IdempotencyStore,
    onError: SqsConsumerErrorHandler = defaultErrorHandler,
  ) {
    this.client = createSqsClient(config ?? loadSqsConfigFromEnv());
    this.idempotencyStore = idempotencyStore ?? new InMemoryIdempotencyStore();
    this.onError = onError;
  }

  register<TPayload>(
    eventType: DomainEventType,
    handler: MessageHandler<TPayload>,
  ): void {
    this.handlers.set(eventType, handler as MessageHandler);
  }

  async start(): Promise<void> {
    if (this.handlers.size === 0 || this.running) {
      return;
    }

    this.running = true;
    this.pollPromise = this.pollLoop();
  }

  async stop(): Promise<void> {
    this.running = false;
    await this.pollPromise;
  }

  private async pollLoop(): Promise<void> {
    while (this.running) {
      try {
        for (const eventType of this.handlers.keys()) {
          await this.pollQueue(eventType);
        }
      } catch (error) {
        this.onError(error, { eventType: [...this.handlers.keys()][0]! });
      }

      await Bun.sleep(1000);
    }
  }

  private async resolveQueueUrl(eventType: DomainEventType): Promise<string> {
    const queueName = queueNameForEvent(eventType);
    const cached = this.queueUrlCache.get(queueName);
    if (cached) {
      return cached;
    }

    const url = await getQueueUrl(this.client, queueName);
    this.queueUrlCache.set(queueName, url);
    return url;
  }

  private async pollQueue(eventType: DomainEventType): Promise<void> {
    const handler = this.handlers.get(eventType);
    if (!handler) {
      return;
    }

    const queueUrl = await this.resolveQueueUrl(eventType);
    const response = await this.client.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 1,
      }),
    );

    for (const message of response.Messages ?? []) {
      if (!message.Body || !message.ReceiptHandle) {
        continue;
      }

      try {
        const envelope = parseMessageEnvelope(message.Body);

        if (this.idempotencyStore.has(envelope.idempotencyKey)) {
          await this.deleteMessage(queueUrl, message.ReceiptHandle);
          continue;
        }

        await handler(envelope);
        this.idempotencyStore.mark(envelope.idempotencyKey);
        await this.deleteMessage(queueUrl, message.ReceiptHandle);
      } catch (error) {
        this.onError(error, {
          eventType,
          idempotencyKey: safeParseIdempotencyKey(message.Body),
        });
      }
    }
  }

  private async deleteMessage(
    queueUrl: string,
    receiptHandle: string,
  ): Promise<void> {
    await this.client.send(
      new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      }),
    );
  }
}

function defaultErrorHandler(error: unknown): void {
  console.error("[SqsMessageConsumer]", error);
}

function safeParseIdempotencyKey(body: string): string | undefined {
  try {
    const parsed = JSON.parse(body) as { idempotencyKey?: string };
    return typeof parsed.idempotencyKey === "string"
      ? parsed.idempotencyKey
      : undefined;
  } catch {
    return undefined;
  }
}
