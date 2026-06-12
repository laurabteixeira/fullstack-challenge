import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  type SQSClient,
} from "@aws-sdk/client-sqs";
import type { DomainEventType } from "../../src/events";
import type { MessageEnvelope } from "../../src/message-envelope";
import { parseMessageEnvelope } from "../../src/message-envelope";
import { queueNameForEvent } from "../../src/queues";
import { getQueueUrl } from "../../src/sqs-client";

type ReceiveByKeyOptions = {
  maxAttempts?: number;
  waitSeconds?: number;
  sleepMs?: number;
};

/**
 * Polls SQS until an envelope with the given idempotencyKey is found.
 * Non-matching messages are deleted so stale queue entries do not block tests.
 */
export async function receiveEnvelopeByIdempotencyKey<TPayload = unknown>(
  client: SQSClient,
  eventType: DomainEventType,
  idempotencyKey: string,
  options: ReceiveByKeyOptions = {},
): Promise<MessageEnvelope<TPayload> | null> {
  const maxAttempts = options.maxAttempts ?? 15;
  const waitSeconds = options.waitSeconds ?? 2;
  const sleepMs = options.sleepMs ?? 500;
  const queueUrl = await getQueueUrl(client, queueNameForEvent(eventType));

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await client.send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: waitSeconds,
      }),
    );

    const message = response.Messages?.[0];
    if (!message?.Body || !message.ReceiptHandle) {
      await Bun.sleep(sleepMs);
      continue;
    }

    const envelope = parseMessageEnvelope<TPayload>(message.Body);

    await client.send(
      new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: message.ReceiptHandle,
      }),
    );

    if (envelope.idempotencyKey === idempotencyKey) {
      return envelope;
    }
  }

  return null;
}
