import { Inject, Injectable } from "@nestjs/common";
import type { Bet } from "../../domain/bet/bet.entity";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "../../domain/round/round.repository";

@Injectable()
export class GetMyBetsUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
  ) {}

  async execute(
    playerId: string,
    page = 1,
    pageSize = 20,
  ): Promise<Bet[]> {
    const offset = Math.max(0, (page - 1) * pageSize);
    return this.roundRepository.findBetsByPlayer(playerId, offset, pageSize);
  }
}
