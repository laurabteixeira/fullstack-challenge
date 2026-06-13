import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { DOMAIN_EVENTS, type MessagePublisher } from "@crash/messaging";
import { Bet } from "../../domain/bet/bet.entity";
import { centsFromNumber } from "../../domain/money";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "../../domain/round/round.repository";
import { RoundEngineService } from "../services/round-engine.service";

export class BetNotAcceptedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BetNotAcceptedError";
  }
}

@Injectable()
export class PlaceBetUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
    @Inject("MessagePublisher")
    private readonly publisher: MessagePublisher,
    private readonly roundEngine: RoundEngineService,
  ) {}

  async execute(playerId: string, amount: number): Promise<Bet> {
    await this.roundEngine.ensureCurrentRound();

    if (!this.roundEngine.acceptsBets()) {
      throw new BetNotAcceptedError("Betting phase is closed");
    }

    const roundId = this.roundEngine.getCurrentRoundId();
    const existing = await this.roundRepository.findBetForPlayerInRound(
      roundId,
      playerId,
    );
    if (existing) {
      throw new BetNotAcceptedError("Player already has a bet in this round");
    }

    const amountCents = centsFromNumber(amount);
    const bet = Bet.createPending({
      id: randomUUID(),
      roundId,
      playerId,
      amountCents,
      idempotencyKey: randomUUID(),
    });

    await this.roundRepository.saveBet(bet);
    await this.publisher.publish(
      DOMAIN_EVENTS.BET_DEBIT_REQUESTED,
      bet.idempotencyKey,
      {
        betId: bet.id,
        playerId,
        amount,
        idempotencyKey: bet.idempotencyKey,
      },
    );

    return bet;
  }
}
