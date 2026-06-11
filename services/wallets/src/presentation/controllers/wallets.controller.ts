import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";
import { MessagingHealthService } from "../../infrastructure/messaging/messaging.health";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";

@Controller()
export class WalletsController {
  constructor(private readonly messagingHealth: MessagingHealthService) {}

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
}
