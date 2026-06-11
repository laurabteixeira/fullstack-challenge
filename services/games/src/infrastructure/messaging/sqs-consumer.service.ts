import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import {
  type DomainEventType,
  type MessageConsumer,
  type MessageHandler,
  SqsMessageConsumer,
} from "@crash/messaging";

@Injectable()
export class SqsConsumerService
  implements MessageConsumer, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SqsConsumerService.name);
  private readonly consumer: SqsMessageConsumer;

  constructor() {
    this.consumer = new SqsMessageConsumer(undefined, undefined, (error) => {
      this.logger.error("SQS consumer error", error);
    });
  }

  register<TPayload>(
    eventType: DomainEventType,
    handler: MessageHandler<TPayload>,
  ): void {
    this.consumer.register(eventType, handler);
  }

  start(): Promise<void> {
    return this.consumer.start();
  }

  stop(): Promise<void> {
    return this.consumer.stop();
  }

  onModuleInit(): Promise<void> {
    return this.start();
  }

  onModuleDestroy(): Promise<void> {
    return this.stop();
  }
}
