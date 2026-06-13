import { Injectable } from "@nestjs/common";
import { Bet } from "../../domain/bet/bet.entity";
import { type BetStatus } from "../../domain/bet/bet-status";
import { Round } from "../../domain/round/round.entity";
import {
  type RoundRepository,
  type RoundWithBets,
} from "../../domain/round/round.repository";
import { type RoundPhase } from "@crash/round-engine";
import { PrismaService } from "./prisma.service";

@Injectable()
export class PrismaRoundRepository implements RoundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCurrent(): Promise<RoundWithBets | null> {
    const row = await this.prisma.round.findFirst({
      where: {
        phase: { in: ["WAITING_BETS", "RUNNING", "CRASHED", "SETTLING"] },
      },
      orderBy: { createdAt: "desc" },
      include: { bets: true },
    });

    return row ? this.toRoundWithBets(row) : null;
  }

  async findById(roundId: string): Promise<RoundWithBets | null> {
    const row = await this.prisma.round.findUnique({
      where: { id: roundId },
      include: { bets: true },
    });

    return row ? this.toRoundWithBets(row) : null;
  }

  async findHistory(offset: number, limit: number): Promise<RoundWithBets[]> {
    const rows = await this.prisma.round.findMany({
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      include: { bets: true },
    });

    return rows.map((row) => this.toRoundWithBets(row));
  }

  async saveRound(round: Round): Promise<void> {
    const props = round.toProps();
    await this.prisma.round.upsert({
      where: { id: props.id },
      create: {
        id: props.id,
        phase: props.phase,
        seedHash: props.seedHash,
        serverSeed: props.serverSeed,
        clientSeed: props.clientSeed,
        crashPointScaled: props.crashPointScaled,
        currentMultiplierScaled: props.currentMultiplierScaled,
        bettingEndsAt: props.bettingEndsAt,
        startedAt: props.startedAt,
        crashedAt: props.crashedAt,
        settledAt: props.settledAt,
      },
      update: {
        phase: props.phase,
        currentMultiplierScaled: props.currentMultiplierScaled,
        bettingEndsAt: props.bettingEndsAt,
        startedAt: props.startedAt,
        crashedAt: props.crashedAt,
        settledAt: props.settledAt,
      },
    });
  }

  async saveBet(bet: Bet): Promise<void> {
    const props = bet.toProps();
    await this.prisma.bet.upsert({
      where: { id: props.id },
      create: {
        id: props.id,
        roundId: props.roundId,
        playerId: props.playerId,
        amountCents: props.amountCents,
        status: props.status,
        cashoutMultiplierScaled: props.cashoutMultiplierScaled,
        payoutCents: props.payoutCents,
        idempotencyKey: props.idempotencyKey,
      },
      update: {
        status: props.status,
        cashoutMultiplierScaled: props.cashoutMultiplierScaled,
        payoutCents: props.payoutCents,
      },
    });
  }

  async findBetByIdempotencyKey(idempotencyKey: string): Promise<Bet | null> {
    const row = await this.prisma.bet.findUnique({ where: { idempotencyKey } });
    return row ? this.toBet(row) : null;
  }

  async findActiveBetForPlayer(
    roundId: string,
    playerId: string,
  ): Promise<Bet | null> {
    const bet = await this.findBetForPlayerInRound(roundId, playerId);
    return bet?.status === "ACTIVE" ? bet : null;
  }

  async findBetForPlayerInRound(
    roundId: string,
    playerId: string,
  ): Promise<Bet | null> {
    const row = await this.prisma.bet.findUnique({
      where: { roundId_playerId: { roundId, playerId } },
    });

    return row ? this.toBet(row) : null;
  }

  async findBetsByPlayer(
    playerId: string,
    offset: number,
    limit: number,
  ): Promise<Bet[]> {
    const rows = await this.prisma.bet.findMany({
      where: { playerId },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    return rows.map((row) => this.toBet(row));
  }

  private toRoundWithBets(row: {
    id: string;
    phase: string;
    seedHash: string;
    serverSeed: string | null;
    clientSeed: string;
    crashPointScaled: number;
    currentMultiplierScaled: number;
    bettingEndsAt: Date | null;
    startedAt: Date | null;
    crashedAt: Date | null;
    settledAt: Date | null;
    bets: Array<{
      id: string;
      roundId: string;
      playerId: string;
      amountCents: bigint;
      status: string;
      cashoutMultiplierScaled: number | null;
      payoutCents: bigint | null;
      idempotencyKey: string;
    }>;
  }): RoundWithBets {
    return {
      round: Round.reconstitute({
        id: row.id,
        phase: row.phase as RoundPhase,
        seedHash: row.seedHash,
        serverSeed: row.serverSeed,
        clientSeed: row.clientSeed,
        crashPointScaled: row.crashPointScaled,
        currentMultiplierScaled: row.currentMultiplierScaled,
        bettingEndsAt: row.bettingEndsAt,
        startedAt: row.startedAt,
        crashedAt: row.crashedAt,
        settledAt: row.settledAt,
      }),
      bets: row.bets.map((bet) => this.toBet(bet)),
    };
  }

  private toBet(row: {
    id: string;
    roundId: string;
    playerId: string;
    amountCents: bigint;
    status: string;
    cashoutMultiplierScaled: number | null;
    payoutCents: bigint | null;
    idempotencyKey: string;
  }): Bet {
    return Bet.reconstitute({
      id: row.id,
      roundId: row.roundId,
      playerId: row.playerId,
      amountCents: row.amountCents,
      status: row.status as BetStatus,
      cashoutMultiplierScaled: row.cashoutMultiplierScaled,
      payoutCents: row.payoutCents,
      idempotencyKey: row.idempotencyKey,
    });
  }
}
