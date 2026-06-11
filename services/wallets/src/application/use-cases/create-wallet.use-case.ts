import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { Wallet } from "../../domain/wallet/wallet.entity";
import {
  WALLET_REPOSITORY,
  type WalletRepository,
} from "../../domain/wallet/wallet.repository";

export class WalletAlreadyExistsError extends Error {
  constructor() {
    super("Wallet already exists");
    this.name = "WalletAlreadyExistsError";
  }
}

@Injectable()
export class CreateWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
  ) {}

  async execute(playerId: string): Promise<Wallet> {
    if (await this.walletRepository.existsByPlayerId(playerId)) {
      throw new WalletAlreadyExistsError();
    }

    const initialBalance = BigInt(
      process.env.WALLET_INITIAL_BALANCE_CENTS ?? "100000",
    );

    const wallet = Wallet.create(randomUUID(), playerId, initialBalance);
    await this.walletRepository.save(wallet);
    return wallet;
  }
}
