import {
  ConflictException,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { CreateWalletUseCase, WalletAlreadyExistsError } from "../../application/use-cases/create-wallet.use-case";
import { GetWalletUseCase, WalletNotFoundError } from "../../application/use-cases/get-wallet.use-case";
import { CurrentPlayer } from "../../infrastructure/auth/current-player.decorator";
import { JwtAuthGuard } from "../../infrastructure/auth/jwt-auth.guard";
import { MessagingHealthService } from "../../infrastructure/messaging/messaging.health";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { toWalletResponseDto, WalletResponseDto } from "../dtos/wallet-response.dto";

@Controller()
export class WalletsController {
  constructor(
    private readonly messagingHealth: MessagingHealthService,
    private readonly createWalletUseCase: CreateWalletUseCase,
    private readonly getWalletUseCase: GetWalletUseCase,
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

    return { status, service: "wallets", messaging };
  }

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  async create(@CurrentPlayer() playerId: string): Promise<WalletResponseDto> {
    try {
      const wallet = await this.createWalletUseCase.execute(playerId);
      return toWalletResponseDto(wallet);
    } catch (error) {
      if (error instanceof WalletAlreadyExistsError) {
        throw new ConflictException("Wallet already exists");
      }
      throw error;
    }
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentPlayer() playerId: string): Promise<WalletResponseDto> {
    try {
      const wallet = await this.getWalletUseCase.execute(playerId);
      return toWalletResponseDto(wallet);
    } catch (error) {
      if (error instanceof WalletNotFoundError) {
        throw new NotFoundException("Wallet not found");
      }
      throw error;
    }
  }
}
