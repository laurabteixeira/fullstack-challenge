import { Wallet } from "../../../src/domain/wallet/wallet.entity";
import type {
  DebitTransactionInput,
  WalletRepository,
} from "../../../src/domain/wallet/wallet.repository";

export class InMemoryWalletRepository implements WalletRepository {
  private readonly wallets = new Map<string, Wallet>();
  private readonly idempotencyKeys = new Set<string>();

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    for (const wallet of this.wallets.values()) {
      if (wallet.playerId === playerId) {
        return Wallet.reconstitute({
          id: wallet.id,
          playerId: wallet.playerId,
          balanceCents: wallet.balanceCents,
        });
      }
    }
    return null;
  }

  async existsByPlayerId(playerId: string): Promise<boolean> {
    return (await this.findByPlayerId(playerId)) !== null;
  }

  async save(wallet: Wallet): Promise<void> {
    this.wallets.set(wallet.id, Wallet.reconstitute({
      id: wallet.id,
      playerId: wallet.playerId,
      balanceCents: wallet.balanceCents,
    }));
  }

  async findProcessedIdempotencyKey(idempotencyKey: string): Promise<boolean> {
    return this.idempotencyKeys.has(idempotencyKey);
  }

  async saveDebit(input: DebitTransactionInput): Promise<void> {
    this.idempotencyKeys.add(input.idempotencyKey);
    await this.save(input.wallet);
  }
}
