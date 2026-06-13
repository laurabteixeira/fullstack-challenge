import { Inject, Injectable } from "@nestjs/common";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
  type RoundWithBets,
} from "../../domain/round/round.repository";
import { RoundEngineService } from "../services/round-engine.service";

@Injectable()
export class GetCurrentRoundUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
    private readonly roundEngine: RoundEngineService,
  ) {}

  async execute(): Promise<RoundWithBets> {
    await this.roundEngine.ensureCurrentRound();
    const current = await this.roundRepository.findCurrent();
    if (!current) {
      throw new Error("Current round not found");
    }
    return current;
  }
}
