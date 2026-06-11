import { Injectable } from "@nestjs/common";
import { DOMAIN_EVENTS } from "@crash/messaging";
import { BetDebitRequestedHandler } from "../../application/handlers/bet-debit-requested.handler";
import { SqsConsumerService } from "./sqs-consumer.service";

@Injectable()
export class MessagingHandlersBootstrap {
  constructor(
    consumer: SqsConsumerService,
    handler: BetDebitRequestedHandler,
  ) {
    consumer.register(DOMAIN_EVENTS.BET_DEBIT_REQUESTED, (envelope) =>
      handler.handle(envelope),
    );
  }
}
