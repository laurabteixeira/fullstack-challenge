import { Inject, Injectable } from "@nestjs/common";
import { Bet } from "../../domain/bet/bet.entity";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "../../domain/round/round.repository";
import { RoundEngineService } from "../services/round-engine.service";

export class CashoutNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CashoutNotAllowedError";
  }
}

@Injectable()
export class CashoutBetUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
    private readonly roundEngine: RoundEngineService,
  ) {}

  async execute(playerId: string): Promise<Bet> {
    await this.roundEngine.ensureCurrentRound();
    const roundId = this.roundEngine.getCurrentRoundId();

    const bet = await this.roundRepository.findActiveBetForPlayer(
      roundId,
      playerId,
    );
    if (!bet) {
      throw new CashoutNotAllowedError("No active bet to cash out");
    }

    const multiplier = this.roundEngine.cashoutMultiplier();
    bet.cashOut(multiplier);
    await this.roundRepository.saveBet(bet);
    return bet;
  }
}
