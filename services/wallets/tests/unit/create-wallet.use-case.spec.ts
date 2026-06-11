import { afterEach, describe, expect, test } from "bun:test";
import {
  CreateWalletUseCase,
  WalletAlreadyExistsError,
} from "../../src/application/use-cases/create-wallet.use-case";
import { InMemoryWalletRepository } from "./fakes/in-memory-wallet.repository";

describe("CreateWalletUseCase", () => {
  afterEach(() => {
    process.env.WALLET_INITIAL_BALANCE_CENTS = "100000";
  });

  test("creates wallet with configured initial balance", async () => {
    process.env.WALLET_INITIAL_BALANCE_CENTS = "5000";
    const useCase = new CreateWalletUseCase(new InMemoryWalletRepository());
    const wallet = await useCase.execute("player-1");

    expect(wallet.playerId).toBe("player-1");
    expect(wallet.balanceCents).toBe(5000n);
  });

  test("rejects duplicate wallet for same player", async () => {
    const repository = new InMemoryWalletRepository();
    const useCase = new CreateWalletUseCase(repository);

    await useCase.execute("player-1");
    await expect(useCase.execute("player-1")).rejects.toThrow(
      WalletAlreadyExistsError,
    );
  });
});
