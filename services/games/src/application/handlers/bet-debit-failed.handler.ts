import { Inject, Injectable } from "@nestjs/common";
import type { MessageEnvelope } from "@crash/messaging";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "../../domain/round/round.repository";

export type BetDebitFailedPayload = {
  betId: string;
  reason: string;
  idempotencyKey: string;
};

@Injectable()
export class BetDebitFailedHandler {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
  ) {}

  async handle(
    envelope: MessageEnvelope<BetDebitFailedPayload>,
  ): Promise<void> {
    const bet = await this.roundRepository.findBetByIdempotencyKey(
      envelope.idempotencyKey,
    );
    if (!bet) {
      return;
    }

    bet.reject();
    await this.roundRepository.saveBet(bet);
  }
}
