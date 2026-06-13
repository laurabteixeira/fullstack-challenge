import { Inject, Injectable } from "@nestjs/common";
import { DOMAIN_EVENTS, type MessagePublisher } from "@crash/messaging";
import { DuplicateIdempotencyKeyError } from "../../domain/errors/duplicate-idempotency-key.error";
import { parsePayoutCents } from "../../domain/money";
import {
  WALLET_REPOSITORY,
  type WalletRepository,
} from "../../domain/wallet/wallet.repository";

export type RoundSettlementResult = {
  betId: string;
  playerId: string;
  payoutCents?: string | number;
  /** @deprecated use payoutCents */
  payout?: number;
};

export type SettleRoundInput = {
  roundId: string;
  results: RoundSettlementResult[];
  idempotencyKey: string;
};

@Injectable()
export class SettleRoundUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
    @Inject("MessagePublisher")
    private readonly publisher: MessagePublisher,
  ) {}

  async execute(input: SettleRoundInput): Promise<void> {
    for (const result of input.results) {
      await this.creditPayout(input.idempotencyKey, result);
    }

    await this.publishSettlementDone(input);
  }

  private async creditPayout(
    settlementKey: string,
    result: RoundSettlementResult,
  ): Promise<void> {
    const payoutCents = parsePayoutCents(
      result.payoutCents ?? result.payout ?? "0",
    );
    if (payoutCents <= 0n) {
      return;
    }

    const creditKey = `${settlementKey}:credit:${result.betId}`;
    if (await this.walletRepository.findProcessedIdempotencyKey(creditKey)) {
      return;
    }

    const wallet = await this.walletRepository.findByPlayerId(result.playerId);
    if (!wallet) {
      throw new Error(`Wallet not found for player ${result.playerId}`);
    }

    wallet.credit(payoutCents);

    try {
      await this.walletRepository.saveCredit({
        wallet,
        amountCents: payoutCents,
        idempotencyKey: creditKey,
        referenceId: result.betId,
      });
    } catch (error) {
      if (error instanceof DuplicateIdempotencyKeyError) {
        return;
      }
      throw error;
    }
  }

  private async publishSettlementDone(input: SettleRoundInput): Promise<void> {
    await this.publisher.publish(
      DOMAIN_EVENTS.ROUND_SETTLEMENT_DONE,
      input.idempotencyKey,
      {
        roundId: input.roundId,
        idempotencyKey: input.idempotencyKey,
      },
    );
  }
}
