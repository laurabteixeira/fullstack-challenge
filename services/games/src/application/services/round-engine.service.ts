import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import {
  deriveCrashPointScaled,
  generateServerSeed,
  hashServerSeed,
} from "@crash/provably-fair";
import {
  ROUND_PHASES,
  RoundLifecycle,
  type RoundEngineConfig,
  type RoundSnapshot,
} from "@crash/round-engine";
import { Inject } from "@nestjs/common";
import { DOMAIN_EVENTS, type MessagePublisher } from "@crash/messaging";
import { Round } from "../../domain/round/round.entity";
import {
  ROUND_REPOSITORY,
  type RoundRepository,
} from "../../domain/round/round.repository";

@Injectable()
export class RoundEngineService {
  private lifecycle: RoundLifecycle | null = null;
  private currentRound: Round | null = null;

  private readonly config: RoundEngineConfig = {
    bettingDurationMs: Number(process.env.ROUND_BETTING_MS ?? 10_000),
    tickIntervalMs: Number(process.env.ROUND_TICK_MS ?? 100),
    multiplierGrowthPerSecond: Number(
      process.env.ROUND_MULTIPLIER_GROWTH ?? 50,
    ),
    settlingDurationMs: Number(process.env.ROUND_SETTLING_MS ?? 2_000),
  };

  constructor(
    @Inject(ROUND_REPOSITORY)
    private readonly roundRepository: RoundRepository,
    @Inject("MessagePublisher")
    private readonly publisher: MessagePublisher,
  ) {}

  getTickIntervalMs(): number {
    return this.config.tickIntervalMs;
  }

  async ensureCurrentRound(): Promise<RoundSnapshot> {
    if (this.lifecycle && this.currentRound) {
      return this.lifecycle.snapshot();
    }

    const existing = await this.roundRepository.findCurrent();
    if (existing) {
      this.currentRound = existing.round;
      this.lifecycle = this.buildLifecycle(existing.round);
      this.lifecycle.restoreSnapshot({
        roundId: existing.round.id,
        phase: existing.round.phase,
        crashPointScaled: existing.round.crashPointScaled,
        currentMultiplierScaled: existing.round.currentMultiplierScaled,
        bettingEndsAt: existing.round.bettingEndsAt?.getTime() ?? null,
        runningStartedAt: existing.round.startedAt?.getTime() ?? null,
        crashedAt: existing.round.crashedAt?.getTime() ?? null,
        settlingEndsAt:
          existing.round.phase === ROUND_PHASES.SETTLING
            ? (existing.round.settledAt?.getTime() ?? null)
            : null,
        completedAt:
          existing.round.phase === ROUND_PHASES.COMPLETED
            ? (existing.round.settledAt?.getTime() ?? null)
            : null,
      });
      if (
        existing.round.phase === ROUND_PHASES.WAITING_BETS &&
        existing.round.bettingEndsAt === null
      ) {
        this.lifecycle.openBetting();
        await this.persistSnapshot();
      }
      return this.lifecycle.snapshot();
    }

    return this.createNextRound();
  }

  async tick(): Promise<RoundSnapshot | null> {
    if (!this.lifecycle || !this.currentRound) {
      return this.ensureCurrentRound();
    }

    if (this.lifecycle.shouldStartRunning()) {
      this.lifecycle.startRunning();
      await this.persistSnapshot();
    }

    if (this.lifecycle.snapshot().phase === ROUND_PHASES.RUNNING) {
      this.lifecycle.tick();
      await this.persistSnapshot();

      if (this.lifecycle.shouldBeginSettling()) {
        await this.settleCurrentRound();
      }
    }

    if (this.lifecycle.shouldCompleteSettling()) {
      return this.advanceToNextRound();
    }

    return this.lifecycle.snapshot();
  }

  acceptsBets(): boolean {
    return this.lifecycle?.acceptsBets() ?? false;
  }

  cashoutMultiplier(): number {
    if (!this.lifecycle) {
      throw new Error("No active round");
    }
    return this.lifecycle.cashoutMultiplier();
  }

  getCurrentRoundId(): string {
    if (!this.currentRound) {
      throw new Error("No active round");
    }
    return this.currentRound.id;
  }

  async onSettlementDone(roundId: string): Promise<void> {
    if (this.currentRound?.id !== roundId || !this.lifecycle) {
      return;
    }

    if (this.lifecycle.snapshot().phase === ROUND_PHASES.SETTLING) {
      await this.advanceToNextRound();
    }
  }

  private async completeCurrentRound(): Promise<void> {
    if (!this.lifecycle || !this.currentRound) {
      return;
    }

    if (this.lifecycle.snapshot().phase !== ROUND_PHASES.SETTLING) {
      return;
    }

    this.lifecycle.complete();
    this.currentRound.applySnapshot(this.lifecycle.snapshot());
    await this.roundRepository.saveRound(this.currentRound);
  }

  private async advanceToNextRound(): Promise<RoundSnapshot> {
    await this.completeCurrentRound();
    return this.createNextRound();
  }

  private async createNextRound(): Promise<RoundSnapshot> {
    const roundId = randomUUID();
    const serverSeed = generateServerSeed();
    const clientSeed = process.env.GAME_CLIENT_SEED ?? "crash-game-public-seed";
    const crashPointScaled = deriveCrashPointScaled({
      serverSeed,
      clientSeed,
      roundId,
    });

    const round = Round.create({
      id: roundId,
      seedHash: hashServerSeed(serverSeed),
      serverSeed,
      clientSeed,
      crashPointScaled,
    });

    this.currentRound = round;
    this.lifecycle = this.buildLifecycle(round);
    this.lifecycle.openBetting();
    await this.persistSnapshot();
    return this.lifecycle.snapshot();
  }

  private buildLifecycle(round: Round): RoundLifecycle {
    return new RoundLifecycle(round.id, round.crashPointScaled, this.config);
  }

  private async persistSnapshot(): Promise<void> {
    if (!this.lifecycle || !this.currentRound) {
      return;
    }

    this.currentRound.applySnapshot(this.lifecycle.snapshot());
    await this.roundRepository.saveRound(this.currentRound);
  }

  private async settleCurrentRound(): Promise<void> {
    if (!this.lifecycle || !this.currentRound) {
      return;
    }

    this.lifecycle.beginSettling();
    await this.persistSnapshot();

    const roundWithBets = await this.roundRepository.findById(
      this.currentRound.id,
    );
    if (!roundWithBets) {
      return;
    }

    for (const bet of roundWithBets.bets) {
      if (bet.status === "ACTIVE") {
        bet.markLost();
        await this.roundRepository.saveBet(bet);
      }
    }

    const refreshed = await this.roundRepository.findById(this.currentRound.id);
    if (!refreshed) {
      return;
    }

    const results = refreshed.bets
      .filter((bet) => bet.status === "CASHED_OUT" || bet.status === "LOST")
      .map((bet) => ({
        betId: bet.id,
        playerId: bet.playerId,
        payoutCents: String(bet.payoutCents ?? 0n),
      }));

    await this.publisher.publish(
      DOMAIN_EVENTS.ROUND_SETTLED,
      `round-settle-${this.currentRound.id}`,
      {
        roundId: this.currentRound.id,
        results,
        idempotencyKey: `round-settle-${this.currentRound.id}`,
      },
    );
  }
}
