import type { Wallet } from "./wallet.entity";

export type DebitTransactionInput = {
  wallet: Wallet;
  amountCents: bigint;
  idempotencyKey: string;
  referenceId: string;
};

export type CreditTransactionInput = {
  wallet: Wallet;
  amountCents: bigint;
  idempotencyKey: string;
  referenceId: string;
};

export interface WalletRepository {
  findByPlayerId(playerId: string): Promise<Wallet | null>;
  existsByPlayerId(playerId: string): Promise<boolean>;
  save(wallet: Wallet): Promise<void>;
  findProcessedIdempotencyKey(idempotencyKey: string): Promise<boolean>;
  saveDebit(input: DebitTransactionInput): Promise<void>;
  saveCredit(input: CreditTransactionInput): Promise<void>;
}

export const WALLET_REPOSITORY = Symbol("WalletRepository");
