import { describe, expect, test } from "bun:test";
import { DOMAIN_EVENTS } from "@crash/messaging";
import { SettleRoundUseCase } from "../../src/application/use-cases/settle-round.use-case";
import { DuplicateIdempotencyKeyError } from "../../src/domain/errors/duplicate-idempotency-key.error";
import { Wallet } from "../../src/domain/wallet/wallet.entity";
import { FakeMessagePublisher } from "./fakes/fake-message-publisher";
import { InMemoryWalletRepository } from "./fakes/in-memory-wallet.repository";

class RaceSimulatingCreditRepository extends InMemoryWalletRepository {
  override async findProcessedIdempotencyKey(): Promise<boolean> {
    return false;
  }

  override async saveCredit(): Promise<void> {
    throw new DuplicateIdempotencyKeyError();
  }
}

describe("SettleRoundUseCase", () => {
  test("credits cashout payouts and publishes round.settlement_done", async () => {
    const repository = new InMemoryWalletRepository();
    const publisher = new FakeMessagePublisher();
    const useCase = new SettleRoundUseCase(repository, publisher);

    const wallet = Wallet.create("w1", "player-1", 50_000n);
    await repository.save(wallet);

    await useCase.execute({
      roundId: "round-1",
      idempotencyKey: "round-settle-round-1",
      results: [
        {
          betId: "bet-win",
          playerId: "player-1",
          payoutCents: "1500",
        },
        {
          betId: "bet-loss",
          playerId: "player-1",
          payoutCents: "0",
        },
      ],
    });

    const updated = await repository.findByPlayerId("player-1");
    expect(updated?.balanceCents).toBe(51_500n);
    expect(publisher.published).toHaveLength(1);
    expect(publisher.published[0]?.eventType).toBe(
      DOMAIN_EVENTS.ROUND_SETTLEMENT_DONE,
    );
    expect(publisher.published[0]?.payload).toEqual({
      roundId: "round-1",
      idempotencyKey: "round-settle-round-1",
    });
  });

  test("skips duplicate credit idempotency keys", async () => {
    const repository = new InMemoryWalletRepository();
    const publisher = new FakeMessagePublisher();
    const useCase = new SettleRoundUseCase(repository, publisher);

    const wallet = Wallet.create("w1", "player-1", 50_000n);
    await repository.save(wallet);

    const input = {
      roundId: "round-1",
      idempotencyKey: "round-settle-round-1",
      results: [
        {
          betId: "bet-win",
          playerId: "player-1",
          payoutCents: "1500",
        },
      ],
    };

    await useCase.execute(input);
    await useCase.execute(input);

    const updated = await repository.findByPlayerId("player-1");
    expect(updated?.balanceCents).toBe(51_500n);
    expect(publisher.published).toHaveLength(2);
  });

  test("republishes settlement_done when saveCredit hits duplicate key", async () => {
    const repository = new RaceSimulatingCreditRepository();
    const publisher = new FakeMessagePublisher();
    const useCase = new SettleRoundUseCase(repository, publisher);

    const wallet = Wallet.create("w1", "player-1", 50_000n);
    await repository.save(wallet);

    await useCase.execute({
      roundId: "round-1",
      idempotencyKey: "round-settle-round-1",
      results: [
        {
          betId: "bet-win",
          playerId: "player-1",
          payoutCents: "1500",
        },
      ],
    });

    expect(publisher.published).toHaveLength(1);
    expect(publisher.published[0]?.eventType).toBe(
      DOMAIN_EVENTS.ROUND_SETTLEMENT_DONE,
    );
  });

  test("throws when wallet is missing for positive payout", async () => {
    const repository = new InMemoryWalletRepository();
    const publisher = new FakeMessagePublisher();
    const useCase = new SettleRoundUseCase(repository, publisher);

    await expect(
      useCase.execute({
        roundId: "round-1",
        idempotencyKey: "round-settle-round-1",
        results: [
          {
            betId: "bet-win",
            playerId: "missing-player",
            payoutCents: "1500",
          },
        ],
      }),
    ).rejects.toThrow("Wallet not found");
    expect(publisher.published).toHaveLength(0);
  });
});
