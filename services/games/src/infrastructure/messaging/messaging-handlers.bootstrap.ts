import { Injectable } from "@nestjs/common";
import { DOMAIN_EVENTS } from "@crash/messaging";
import {
  BetDebitedHandler,
  type BetDebitedPayload,
} from "../../application/handlers/bet-debited.handler";
import {
  BetDebitFailedHandler,
  type BetDebitFailedPayload,
} from "../../application/handlers/bet-debit-failed.handler";
import {
  RoundSettlementDoneHandler,
  type RoundSettlementDonePayload,
} from "../../application/handlers/round-settlement-done.handler";
import { SqsConsumerService } from "./sqs-consumer.service";

@Injectable()
export class MessagingHandlersBootstrap {
  constructor(
    consumer: SqsConsumerService,
    betDebitedHandler: BetDebitedHandler,
    betDebitFailedHandler: BetDebitFailedHandler,
    roundSettlementDoneHandler: RoundSettlementDoneHandler,
  ) {
    consumer.register<BetDebitedPayload>(
      DOMAIN_EVENTS.BET_DEBITED,
      (envelope) => betDebitedHandler.handle(envelope),
    );
    consumer.register<BetDebitFailedPayload>(
      DOMAIN_EVENTS.BET_DEBIT_FAILED,
      (envelope) => betDebitFailedHandler.handle(envelope),
    );
    consumer.register<RoundSettlementDonePayload>(
      DOMAIN_EVENTS.ROUND_SETTLEMENT_DONE,
      (envelope) => roundSettlementDoneHandler.handle(envelope),
    );
  }
}
