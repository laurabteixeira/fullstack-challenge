import { Inject, Injectable } from "@nestjs/common";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
  type RoundWithBets,
} from "../../domain/round/round.repository";

@Injectable()
export class GetRoundHistoryUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
  ) {}

  async execute(page = 1, pageSize = 20): Promise<RoundWithBets[]> {
    const offset = Math.max(0, (page - 1) * pageSize);
    return this.roundRepository.findHistory(offset, pageSize);
  }
}
