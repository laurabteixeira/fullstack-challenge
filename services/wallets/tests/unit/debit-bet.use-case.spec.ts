import { describe, expect, test } from "bun:test";
import { DOMAIN_EVENTS } from "@crash/messaging";
import { DebitBetUseCase } from "../../src/application/use-cases/debit-bet.use-case";
import { Wallet } from "../../src/domain/wallet/wallet.entity";
import { FakeMessagePublisher } from "./fakes/fake-message-publisher";
import { InMemoryWalletRepository } from "./fakes/in-memory-wallet.repository";

describe("DebitBetUseCase", () => {
  test("debits wallet and publishes bet.debited", async () => {
    const repository = new InMemoryWalletRepository();
    const publisher = new FakeMessagePublisher();
    const useCase = new DebitBetUseCase(repository, publisher);

    const wallet = Wallet.create("w1", "player-1", 1000n);
    await repository.save(wallet);

    await useCase.execute({
      betId: "bet-1",
      playerId: "player-1",
      amount: 400,
      idempotencyKey: "idem-1",
    });

    const updated = await repository.findByPlayerId("player-1");
    expect(updated?.balanceCents).toBe(600n);
    expect(publisher.published).toHaveLength(1);
    expect(publisher.published[0]?.eventType).toBe(DOMAIN_EVENTS.BET_DEBITED);
  });

  test("publishes bet.debit_failed when balance is insufficient", async () => {
    const repository = new InMemoryWalletRepository();
    const publisher = new FakeMessagePublisher();
    const useCase = new DebitBetUseCase(repository, publisher);

    const wallet = Wallet.create("w1", "player-1", 100n);
    await repository.save(wallet);

    await useCase.execute({
      betId: "bet-2",
      playerId: "player-1",
      amount: 400,
      idempotencyKey: "idem-2",
    });

    expect(publisher.published[0]?.eventType).toBe(DOMAIN_EVENTS.BET_DEBIT_FAILED);
    expect(publisher.published[0]?.payload).toMatchObject({
      reason: "insufficient_balance",
    });
  });

  test("publishes bet.debit_failed when wallet is missing", async () => {
    const repository = new InMemoryWalletRepository();
    const publisher = new FakeMessagePublisher();
    const useCase = new DebitBetUseCase(repository, publisher);

    await useCase.execute({
      betId: "bet-3",
      playerId: "missing-player",
      amount: 100,
      idempotencyKey: "idem-3",
    });

    expect(publisher.published[0]?.eventType).toBe(DOMAIN_EVENTS.BET_DEBIT_FAILED);
    expect(publisher.published[0]?.payload).toMatchObject({
      reason: "wallet_not_found",
    });
  });

  test("republishes bet.debited for duplicate idempotency key", async () => {
    const repository = new InMemoryWalletRepository();
    const publisher = new FakeMessagePublisher();
    const useCase = new DebitBetUseCase(repository, publisher);

    const wallet = Wallet.create("w1", "player-1", 1000n);
    await repository.save(wallet);

    await useCase.execute({
      betId: "bet-4",
      playerId: "player-1",
      amount: 100,
      idempotencyKey: "idem-4",
    });

    await useCase.execute({
      betId: "bet-4",
      playerId: "player-1",
      amount: 100,
      idempotencyKey: "idem-4",
    });

    expect(publisher.published).toHaveLength(2);
    expect(publisher.published[1]?.eventType).toBe(DOMAIN_EVENTS.BET_DEBITED);
  });
});
