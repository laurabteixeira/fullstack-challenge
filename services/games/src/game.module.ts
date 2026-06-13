import { Module } from "@nestjs/common";
import { BetDebitedHandler } from "./application/handlers/bet-debited.handler";
import { BetDebitFailedHandler } from "./application/handlers/bet-debit-failed.handler";
import { RoundSettlementDoneHandler } from "./application/handlers/round-settlement-done.handler";
import { RoundEngineService } from "./application/services/round-engine.service";
import { CashoutBetUseCase } from "./application/use-cases/cashout-bet.use-case";
import { GetCurrentRoundUseCase } from "./application/use-cases/get-current-round.use-case";
import { GetMyBetsUseCase } from "./application/use-cases/get-my-bets.use-case";
import { GetRoundHistoryUseCase } from "./application/use-cases/get-round-history.use-case";
import { PlaceBetUseCase } from "./application/use-cases/place-bet.use-case";
import { VerifyRoundUseCase } from "./application/use-cases/verify-round.use-case";
import { ROUND_REPOSITORY } from "./domain/round/round.repository";
import { AuthModule } from "./infrastructure/auth/auth.module";
import { RoundEngineRunner } from "./infrastructure/engine/round-engine.runner";
import { MessagingHandlersBootstrap } from "./infrastructure/messaging/messaging-handlers.bootstrap";
import { MessagingModule } from "./infrastructure/messaging/messaging.module";
import { PrismaRoundRepository } from "./infrastructure/persistence/prisma-round.repository";
import { PrismaModule } from "./infrastructure/persistence/prisma.module";
import { GamesController } from "./presentation/controllers/games.controller";

@Module({
  imports: [PrismaModule, AuthModule, MessagingModule],
  controllers: [GamesController],
  providers: [
    PrismaRoundRepository,
    {
      provide: ROUND_REPOSITORY,
      useExisting: PrismaRoundRepository,
    },
    RoundEngineService,
    RoundEngineRunner,
    GetCurrentRoundUseCase,
    GetRoundHistoryUseCase,
    VerifyRoundUseCase,
    GetMyBetsUseCase,
    PlaceBetUseCase,
    CashoutBetUseCase,
    BetDebitedHandler,
    BetDebitFailedHandler,
    RoundSettlementDoneHandler,
    MessagingHandlersBootstrap,
  ],
})
export class GameModule {}
