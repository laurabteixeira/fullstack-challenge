import { Module } from "@nestjs/common";
import { BetDebitRequestedHandler } from "./application/handlers/bet-debit-requested.handler";
import { RoundSettledHandler } from "./application/handlers/round-settled.handler";
import { CreateWalletUseCase } from "./application/use-cases/create-wallet.use-case";
import { DebitBetUseCase } from "./application/use-cases/debit-bet.use-case";
import { GetWalletUseCase } from "./application/use-cases/get-wallet.use-case";
import { SettleRoundUseCase } from "./application/use-cases/settle-round.use-case";
import { WALLET_REPOSITORY } from "./domain/wallet/wallet.repository";
import { AuthModule } from "./infrastructure/auth/auth.module";
import { MessagingHandlersBootstrap } from "./infrastructure/messaging/messaging-handlers.bootstrap";
import { MessagingModule } from "./infrastructure/messaging/messaging.module";
import { PrismaWalletRepository } from "./infrastructure/persistence/prisma-wallet.repository";
import { PrismaModule } from "./infrastructure/persistence/prisma.module";
import { WalletsController } from "./presentation/controllers/wallets.controller";

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
    SettleRoundUseCase,
    BetDebitRequestedHandler,
    RoundSettledHandler,
    MessagingHandlersBootstrap,
  ],
})
export class WalletModule {}
