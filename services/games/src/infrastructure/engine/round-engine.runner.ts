import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { RoundEngineService } from "../../application/services/round-engine.service";

@Injectable()
export class RoundEngineRunner implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RoundEngineRunner.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly roundEngine: RoundEngineService) {}

  async onModuleInit(): Promise<void> {
    await this.roundEngine.ensureCurrentRound();
    this.timer = setInterval(() => {
      void this.roundEngine.tick().catch((error) => {
        this.logger.error("Round engine tick failed", error);
      });
    }, this.roundEngine.getTickIntervalMs());
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
