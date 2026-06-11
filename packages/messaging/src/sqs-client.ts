import {
  GetQueueUrlCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
  type SQSClientConfig,
} from "@aws-sdk/client-sqs";
import type { DomainEventType } from "./events";
import { queueNameForEvent } from "./queues";
import {
  type MessageEnvelope,
  createMessageEnvelope,
  parseMessageEnvelope,
} from "./message-envelope";
import { type SqsConfig } from "./sqs-config";

export function createSqsClient(config: SqsConfig): SQSClient {
  const clientConfig: SQSClientConfig = {
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  };

  if (config.endpoint) {
    clientConfig.endpoint = config.endpoint;
  }

  return new SQSClient(clientConfig);
}

export async function getQueueUrl(
  client: SQSClient,
  queueName: string,
): Promise<string> {
  const response = await client.send(
    new GetQueueUrlCommand({ QueueName: queueName }),
  );

  if (!response.QueueUrl) {
    throw new Error(`Queue URL not found for ${queueName}`);
  }

  return response.QueueUrl;
}

export async function sendEnvelope<TPayload>(
  client: SQSClient,
  eventType: DomainEventType,
  idempotencyKey: string,
  payload: TPayload,
): Promise<void> {
  const queueName = queueNameForEvent(eventType);
  const queueUrl = await getQueueUrl(client, queueName);
  const envelope = createMessageEnvelope(eventType, idempotencyKey, payload);

  await client.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(envelope),
    }),
  );
}

export async function receiveOneMessage<TPayload = unknown>(
  client: SQSClient,
  eventType: DomainEventType,
  options: { waitSeconds?: number } = {},
): Promise<MessageEnvelope<TPayload> | null> {
  const queueUrl = await getQueueUrl(client, queueNameForEvent(eventType));
  const response = await client.send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: options.waitSeconds ?? 2,
    }),
  );

  const message = response.Messages?.[0];
  if (!message?.Body) {
    return null;
  }

  return parseMessageEnvelope<TPayload>(message.Body);
}

export type { MessageEnvelope };
