import { Injectable } from "@nestjs/common";
import { DOMAIN_EVENTS } from "@crash/messaging";
import {
  BetDebitRequestedHandler,
  type BetDebitRequestedPayload,
} from "../../application/handlers/bet-debit-requested.handler";
import {
  RoundSettledHandler,
  type RoundSettledPayload,
} from "../../application/handlers/round-settled.handler";
import { SqsConsumerService } from "./sqs-consumer.service";

@Injectable()
export class MessagingHandlersBootstrap {
  constructor(
    consumer: SqsConsumerService,
    betDebitRequestedHandler: BetDebitRequestedHandler,
    roundSettledHandler: RoundSettledHandler,
  ) {
    consumer.register<BetDebitRequestedPayload>(
      DOMAIN_EVENTS.BET_DEBIT_REQUESTED,
      (envelope) => betDebitRequestedHandler.handle(envelope),
    );
    consumer.register<RoundSettledPayload>(
      DOMAIN_EVENTS.ROUND_SETTLED,
      (envelope) => roundSettledHandler.handle(envelope),
    );
  }
}
