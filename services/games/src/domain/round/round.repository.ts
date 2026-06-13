import type { Bet } from "../bet/bet.entity";
import type { Round } from "./round.entity";

export const ROUND_REPOSITORY = Symbol("ROUND_REPOSITORY");

export type RoundWithBets = {
  round: Round;
  bets: Bet[];
};

export interface RoundRepository {
  findCurrent(): Promise<RoundWithBets | null>;
  findById(roundId: string): Promise<RoundWithBets | null>;
  findHistory(offset: number, limit: number): Promise<RoundWithBets[]>;
  saveRound(round: Round): Promise<void>;
  saveBet(bet: Bet): Promise<void>;
  findBetByIdempotencyKey(idempotencyKey: string): Promise<Bet | null>;
  findActiveBetForPlayer(roundId: string, playerId: string): Promise<Bet | null>;
  findBetForPlayerInRound(roundId: string, playerId: string): Promise<Bet | null>;
  findBetsByPlayer(playerId: string, offset: number, limit: number): Promise<Bet[]>;
}
