import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { ROUND_PHASES } from "@crash/round-engine";
import { formatMultiplier } from "@crash/provably-fair";
import {
  BetNotAcceptedError,
  PlaceBetUseCase,
} from "../../application/use-cases/place-bet.use-case";
import {
  CashoutBetUseCase,
  CashoutNotAllowedError,
} from "../../application/use-cases/cashout-bet.use-case";
import { GetCurrentRoundUseCase } from "../../application/use-cases/get-current-round.use-case";
import { GetMyBetsUseCase } from "../../application/use-cases/get-my-bets.use-case";
import { GetRoundHistoryUseCase } from "../../application/use-cases/get-round-history.use-case";
import { VerifyRoundUseCase } from "../../application/use-cases/verify-round.use-case";
import { CurrentPlayer } from "../../infrastructure/auth/current-player.decorator";
import { JwtAuthGuard } from "../../infrastructure/auth/jwt-auth.guard";
import { MessagingHealthService } from "../../infrastructure/messaging/messaging.health";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import {
  toBetResponseDto,
  toRoundResponseDto,
  type VerifyRoundResponseDto,
} from "../dtos/round-response.dto";

type PlaceBetBody = { amount: number };

@Controller()
export class GamesController {
  constructor(
    private readonly messagingHealth: MessagingHealthService,
    private readonly getCurrentRoundUseCase: GetCurrentRoundUseCase,
    private readonly getRoundHistoryUseCase: GetRoundHistoryUseCase,
    private readonly verifyRoundUseCase: VerifyRoundUseCase,
    private readonly getMyBetsUseCase: GetMyBetsUseCase,
    private readonly placeBetUseCase: PlaceBetUseCase,
    private readonly cashoutBetUseCase: CashoutBetUseCase,
  ) {}

  @Get("health")
  async check(
    @Res({ passthrough: true }) res: Response,
  ): Promise<HealthCheckResponseDto> {
    const messaging = await this.messagingHealth.check();
    const status = messaging === "ok" ? "ok" : "degraded";

    if (status === "degraded") {
      res.status(503);
    }

    return { status, service: "games", messaging };
  }

  @Get("rounds/current")
  async getCurrentRound() {
    const current = await this.getCurrentRoundUseCase.execute();
    const revealCrashPoint =
      current.round.phase === ROUND_PHASES.CRASHED ||
      current.round.phase === ROUND_PHASES.SETTLING;
    return toRoundResponseDto(
      current.round,
      current.bets,
      revealCrashPoint,
    );
  }

  @Get("rounds/history")
  async getRoundHistory(
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    const history = await this.getRoundHistoryUseCase.execute(
      Number(page ?? 1),
      Number(pageSize ?? 20),
    );

    return history.map((item) =>
      toRoundResponseDto(item.round, item.bets, true),
    );
  }

  @Get("rounds/:roundId/verify")
  async verifyRound(
    @Param("roundId") roundId: string,
  ): Promise<VerifyRoundResponseDto> {
    try {
      const result = await this.verifyRoundUseCase.execute(roundId);
      return {
        roundId: result.roundId,
        seedHash: result.seedHash,
        serverSeed: result.serverSeed,
        clientSeed: result.clientSeed,
        crashPoint: formatMultiplier(result.crashPointScaled),
        verified: result.verified,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException("Round not found");
    }
  }

  @Get("bets/me")
  @UseGuards(JwtAuthGuard)
  async getMyBets(
    @CurrentPlayer() playerId: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    const bets = await this.getMyBetsUseCase.execute(
      playerId,
      Number(page ?? 1),
      Number(pageSize ?? 20),
    );
    return bets.map(toBetResponseDto);
  }

  @Post("bet")
  @UseGuards(JwtAuthGuard)
  async placeBet(
    @CurrentPlayer() playerId: string,
    @Body() body: PlaceBetBody,
  ) {
    try {
      const bet = await this.placeBetUseCase.execute(playerId, body.amount);
      return toBetResponseDto(bet);
    } catch (error) {
      if (error instanceof BetNotAcceptedError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof Error && error.message.includes("cents")) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Post("bet/cashout")
  @UseGuards(JwtAuthGuard)
  async cashout(@CurrentPlayer() playerId: string) {
    try {
      const bet = await this.cashoutBetUseCase.execute(playerId);
      return toBetResponseDto(bet);
    } catch (error) {
      if (error instanceof CashoutNotAllowedError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
