import { Inject, Injectable } from "@nestjs/common";
import { DOMAIN_EVENTS, type MessagePublisher } from "@crash/messaging";
import { DuplicateIdempotencyKeyError } from "../../domain/errors/duplicate-idempotency-key.error";
import { InsufficientBalanceError } from "../../domain/errors/insufficient-balance.error";
import { centsFromNumber } from "../../domain/money";
import {
  WALLET_REPOSITORY,
  type WalletRepository,
} from "../../domain/wallet/wallet.repository";

export type DebitBetInput = {
  betId: string;
  playerId: string;
  amount: number;
  idempotencyKey: string;
};

@Injectable()
export class DebitBetUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
    @Inject("MessagePublisher")
    private readonly publisher: MessagePublisher,
  ) {}

  async execute(input: DebitBetInput): Promise<void> {
    if (await this.walletRepository.findProcessedIdempotencyKey(input.idempotencyKey)) {
      await this.publishBetDebited(input);
      return;
    }

    const wallet = await this.walletRepository.findByPlayerId(input.playerId);
    if (!wallet) {
      await this.publishFailure(input, "wallet_not_found");
      return;
    }

    const amountCents = centsFromNumber(input.amount);

    try {
      wallet.debit(amountCents);
    } catch (error) {
      if (error instanceof InsufficientBalanceError) {
        await this.publishFailure(input, "insufficient_balance");
        return;
      }
      throw error;
    }

    try {
      await this.walletRepository.saveDebit({
        wallet,
        amountCents,
        idempotencyKey: input.idempotencyKey,
        referenceId: input.betId,
      });
    } catch (error) {
      if (error instanceof DuplicateIdempotencyKeyError) {
        await this.publishBetDebited(input);
        return;
      }
      throw error;
    }

    await this.publishBetDebited(input);
  }

  private async publishBetDebited(input: DebitBetInput): Promise<void> {
    await this.publisher.publish(
      DOMAIN_EVENTS.BET_DEBITED,
      input.idempotencyKey,
      { betId: input.betId, idempotencyKey: input.idempotencyKey },
    );
  }

  private async publishFailure(
    input: DebitBetInput,
    reason: string,
  ): Promise<void> {
    await this.publisher.publish(
      DOMAIN_EVENTS.BET_DEBIT_FAILED,
      input.idempotencyKey,
      {
        betId: input.betId,
        reason,
        idempotencyKey: input.idempotencyKey,
      },
    );
  }
}
