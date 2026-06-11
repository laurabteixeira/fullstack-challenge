import { Module } from "@nestjs/common";
import { MessagingHealthService } from "./messaging.health";
import { SqsConsumerService } from "./sqs-consumer.service";
import { SqsPublisherAdapter } from "./sqs-publisher.adapter";

@Module({
  providers: [
    SqsPublisherAdapter,
    SqsConsumerService,
    MessagingHealthService,
    {
      provide: "MessagePublisher",
      useExisting: SqsPublisherAdapter,
    },
  ],
  exports: [SqsPublisherAdapter, SqsConsumerService, MessagingHealthService, "MessagePublisher"],
})
export class MessagingModule {}
