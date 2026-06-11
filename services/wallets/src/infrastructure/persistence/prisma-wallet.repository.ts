import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { Wallet } from "../../domain/wallet/wallet.entity";
import {
  type DebitTransactionInput,
  type WalletRepository,
} from "../../domain/wallet/wallet.repository";

@Injectable()
export class PrismaWalletRepository implements WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    const row = await this.prisma.wallet.findUnique({ where: { playerId } });
    if (!row) {
      return null;
    }

    return Wallet.reconstitute({
      id: row.id,
      playerId: row.playerId,
      balanceCents: row.balanceCents,
    });
  }

  async existsByPlayerId(playerId: string): Promise<boolean> {
    const count = await this.prisma.wallet.count({ where: { playerId } });
    return count > 0;
  }

  async save(wallet: Wallet): Promise<void> {
    await this.prisma.wallet.upsert({
      where: { id: wallet.id },
      create: {
        id: wallet.id,
        playerId: wallet.playerId,
        balanceCents: wallet.balanceCents,
      },
      update: {
        balanceCents: wallet.balanceCents,
      },
    });
  }

  async findProcessedIdempotencyKey(idempotencyKey: string): Promise<boolean> {
    const row = await this.prisma.walletTransaction.findUnique({
      where: { idempotencyKey },
      select: { id: true },
    });
    return row !== null;
  }

  async saveDebit(input: DebitTransactionInput): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: input.wallet.id },
        data: { balanceCents: input.wallet.balanceCents },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: input.wallet.id,
          type: "DEBIT",
          amountCents: input.amountCents,
          idempotencyKey: input.idempotencyKey,
          referenceId: input.referenceId,
        },
      });
    });
  }
}
