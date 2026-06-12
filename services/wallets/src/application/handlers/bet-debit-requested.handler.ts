import { Injectable } from "@nestjs/common";
import type { MessageEnvelope } from "@crash/messaging";
import { DebitBetUseCase } from "../use-cases/debit-bet.use-case";

export type BetDebitRequestedPayload = {
  betId: string;
  playerId: string;
  amount: number;
  idempotencyKey: string;
};

@Injectable()
export class BetDebitRequestedHandler {
  constructor(private readonly debitBetUseCase: DebitBetUseCase) {}

  async handle(envelope: MessageEnvelope<BetDebitRequestedPayload>): Promise<void> {
    const { betId, playerId, amount } = envelope.payload;
    await this.debitBetUseCase.execute({
      betId,
      playerId,
      amount,
      idempotencyKey: envelope.idempotencyKey,
    });
  }
}
