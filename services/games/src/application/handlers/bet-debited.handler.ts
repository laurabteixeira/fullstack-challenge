import { Inject, Injectable } from "@nestjs/common";
import type { MessageEnvelope } from "@crash/messaging";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "../../domain/round/round.repository";

export type BetDebitedPayload = {
  betId: string;
  idempotencyKey: string;
};

@Injectable()
export class BetDebitedHandler {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
  ) {}

  async handle(envelope: MessageEnvelope<BetDebitedPayload>): Promise<void> {
    const bet = await this.roundRepository.findBetByIdempotencyKey(
      envelope.idempotencyKey,
    );
    if (!bet) {
      return;
    }

    bet.activate();
    await this.roundRepository.saveBet(bet);
  }
}
