import { formatMultiplier } from "@crash/provably-fair";
import type { Bet } from "../../domain/bet/bet.entity";
import type { Round } from "../../domain/round/round.entity";

export type BetResponseDto = {
  id: string;
  playerId: string;
  amountCents: string;
  status: string;
  cashoutMultiplier: string | null;
  payoutCents: string | null;
};

export type RoundResponseDto = {
  id: string;
  phase: string;
  seedHash: string;
  clientSeed: string;
  crashPoint: string | null;
  currentMultiplier: string;
  bettingEndsAt: string | null;
  startedAt: string | null;
  crashedAt: string | null;
  bets: BetResponseDto[];
};

export type VerifyRoundResponseDto = {
  roundId: string;
  seedHash: string;
  serverSeed: string | null;
  clientSeed: string;
  crashPoint: string;
  verified: boolean;
};

export function toBetResponseDto(bet: Bet): BetResponseDto {
  return {
    id: bet.id,
    playerId: bet.playerId,
    amountCents: bet.amountCents.toString(),
    status: bet.status,
    cashoutMultiplier:
      bet.cashoutMultiplierScaled === null
        ? null
        : formatMultiplier(bet.cashoutMultiplierScaled),
    payoutCents: bet.payoutCents?.toString() ?? null,
  };
}

export function toRoundResponseDto(
  round: Round,
  bets: Bet[],
  revealCrashPoint = false,
): RoundResponseDto {
  return {
    id: round.id,
    phase: round.phase,
    seedHash: round.seedHash,
    clientSeed: round.clientSeed,
    crashPoint:
      revealCrashPoint ? formatMultiplier(round.crashPointScaled) : null,
    currentMultiplier: formatMultiplier(round.currentMultiplierScaled),
    bettingEndsAt: round.bettingEndsAt?.toISOString() ?? null,
    startedAt: round.startedAt?.toISOString() ?? null,
    crashedAt: round.crashedAt?.toISOString() ?? null,
    bets: bets.map(toBetResponseDto),
  };
}
