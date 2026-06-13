import { Injectable } from "@nestjs/common";
import type { MessageEnvelope } from "@crash/messaging";
import { SettleRoundUseCase } from "../use-cases/settle-round.use-case";

export type RoundSettledPayload = {
  roundId: string;
  results: Array<{
    betId: string;
    playerId: string;
    payoutCents: string | number;
  }>;
  idempotencyKey: string;
};

@Injectable()
export class RoundSettledHandler {
  constructor(private readonly settleRoundUseCase: SettleRoundUseCase) {}

  async handle(envelope: MessageEnvelope<RoundSettledPayload>): Promise<void> {
    const { roundId, results, idempotencyKey } = envelope.payload;
    await this.settleRoundUseCase.execute({
      roundId,
      results,
      idempotencyKey,
    });
  }
}
