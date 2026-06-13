import {
  computeMultiplierAt,
  hasReachedCrashPoint,
} from "./multiplier-curve";
import {
  ROUND_PHASES,
  type RoundEngineConfig,
  type RoundPhase,
  type RoundSnapshot,
} from "./types";

export class RoundLifecycle {
  private phase: RoundPhase = ROUND_PHASES.WAITING_BETS;
  private bettingEndsAt: number | null = null;
  private runningStartedAt: number | null = null;
  private crashedAt: number | null = null;
  private settlingEndsAt: number | null = null;
  private completedAt: number | null = null;
  private currentMultiplierScaled: number;

  constructor(
    private readonly roundId: string,
    private readonly crashPointScaled: number,
    private readonly config: RoundEngineConfig,
    private readonly now: () => number = () => Date.now(),
  ) {
    this.currentMultiplierScaled = 100;
  }

  snapshot(): RoundSnapshot {
    return {
      roundId: this.roundId,
      phase: this.phase,
      crashPointScaled: this.crashPointScaled,
      currentMultiplierScaled: this.currentMultiplierScaled,
      bettingEndsAt: this.bettingEndsAt,
      runningStartedAt: this.runningStartedAt,
      crashedAt: this.crashedAt,
      settlingEndsAt: this.settlingEndsAt,
      completedAt: this.completedAt,
    };
  }

  openBetting(): void {
    if (this.phase !== ROUND_PHASES.WAITING_BETS) {
      throw new Error("Round is not waiting for bets");
    }

    this.bettingEndsAt = this.now() + this.config.bettingDurationMs;
  }

  shouldStartRunning(): boolean {
    return (
      this.phase === ROUND_PHASES.WAITING_BETS &&
      this.bettingEndsAt !== null &&
      this.now() >= this.bettingEndsAt
    );
  }

  startRunning(): void {
    if (!this.shouldStartRunning()) {
      throw new Error("Betting window is still open");
    }

    this.phase = ROUND_PHASES.RUNNING;
    this.runningStartedAt = this.now();
    this.currentMultiplierScaled = 100;
  }

  tick(): RoundSnapshot {
    if (this.phase !== ROUND_PHASES.RUNNING || this.runningStartedAt === null) {
      return this.snapshot();
    }

    this.currentMultiplierScaled = computeMultiplierAt(
      this.runningStartedAt,
      this.now(),
      this.crashPointScaled,
      this.config.multiplierGrowthPerSecond,
    );

    if (hasReachedCrashPoint(this.currentMultiplierScaled, this.crashPointScaled)) {
      this.phase = ROUND_PHASES.CRASHED;
      this.crashedAt = this.now();
      this.currentMultiplierScaled = this.crashPointScaled;
      this.settlingEndsAt = this.crashedAt + this.config.settlingDurationMs;
    }

    return this.snapshot();
  }

  shouldBeginSettling(): boolean {
    return this.phase === ROUND_PHASES.CRASHED;
  }

  beginSettling(): void {
    if (this.phase !== ROUND_PHASES.CRASHED) {
      throw new Error("Round has not crashed yet");
    }

    this.phase = ROUND_PHASES.SETTLING;
    if (this.settlingEndsAt === null) {
      this.settlingEndsAt = this.now() + this.config.settlingDurationMs;
    }
  }

  shouldCompleteSettling(): boolean {
    return (
      this.phase === ROUND_PHASES.SETTLING &&
      this.settlingEndsAt !== null &&
      this.now() >= this.settlingEndsAt
    );
  }

  complete(): void {
    if (this.phase !== ROUND_PHASES.SETTLING) {
      throw new Error("Round is not settling");
    }

    this.phase = ROUND_PHASES.COMPLETED;
    this.completedAt = this.now();
  }

  cashoutMultiplier(): number {
    if (this.phase !== ROUND_PHASES.RUNNING) {
      throw new Error("Cashout is only allowed while round is running");
    }

    return this.currentMultiplierScaled;
  }

  acceptsBets(): boolean {
    return (
      this.phase === ROUND_PHASES.WAITING_BETS &&
      this.bettingEndsAt !== null &&
      this.now() < this.bettingEndsAt
    );
  }

  restoreSnapshot(snapshot: RoundSnapshot): void {
    this.phase = snapshot.phase;
    this.bettingEndsAt = snapshot.bettingEndsAt;
    this.runningStartedAt = snapshot.runningStartedAt;
    this.crashedAt = snapshot.crashedAt;
    this.settlingEndsAt = snapshot.settlingEndsAt;
    this.completedAt = snapshot.completedAt;
    this.currentMultiplierScaled = snapshot.currentMultiplierScaled;
  }
}
