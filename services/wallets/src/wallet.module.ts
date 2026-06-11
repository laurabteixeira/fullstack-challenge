import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../persistence/prisma.module";
import { PrismaWalletRepository } from "../persistence/prisma-wallet.repository";
import { BetDebitRequestedHandler } from "../../application/handlers/bet-debit-requested.handler";
import { CreateWalletUseCase } from "../../application/use-cases/create-wallet.use-case";
import { DebitBetUseCase } from "../../application/use-cases/debit-bet.use-case";
import { GetWalletUseCase } from "../../application/use-cases/get-wallet.use-case";
import { WALLET_REPOSITORY } from "../../domain/wallet/wallet.repository";
import { MessagingModule } from "../messaging/messaging.module";
import { MessagingHandlersBootstrap } from "../messaging/messaging-handlers.bootstrap";
import { WalletsController } from "../../presentation/controllers/wallets.controller";

@Module({
  imports: [PrismaModule, AuthModule, MessagingModule],
  controllers: [WalletsController],
  providers: [
    PrismaWalletRepository,
    {
      provide: WALLET_REPOSITORY,
      useExisting: PrismaWalletRepository,
    },
    CreateWalletUseCase,
    GetWalletUseCase,
    DebitBetUseCase,
    BetDebitRequestedHandler,
    MessagingHandlersBootstrap,
  ],
})
export class WalletModule {}
