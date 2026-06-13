import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { verifyCrashPoint } from "@crash/provably-fair";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "../../domain/round/round.repository";

export type VerifyRoundResult = {
  roundId: string;
  seedHash: string;
  serverSeed: string | null;
  clientSeed: string;
  crashPointScaled: number;
  verified: boolean;
};

@Injectable()
export class VerifyRoundUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
  ) {}

  async execute(roundId: string): Promise<VerifyRoundResult> {
    const roundWithBets = await this.roundRepository.findById(roundId);
    if (!roundWithBets) {
      throw new NotFoundException("Round not found");
    }

    const round = roundWithBets.round;
    const verified =
      round.serverSeed !== null &&
      verifyCrashPoint({
        serverSeed: round.serverSeed,
        seedHash: round.seedHash,
        clientSeed: round.clientSeed,
        roundId: round.id,
        crashPointScaled: round.crashPointScaled,
      });

    return {
      roundId: round.id,
      seedHash: round.seedHash,
      serverSeed: round.serverSeed,
      clientSeed: round.clientSeed,
      crashPointScaled: round.crashPointScaled,
      verified,
    };
  }
}
