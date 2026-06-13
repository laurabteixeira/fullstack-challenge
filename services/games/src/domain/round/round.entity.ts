import { ROUND_PHASES, type RoundPhase } from "@crash/round-engine";

export type RoundProps = {
  id: string;
  phase: RoundPhase;
  seedHash: string;
  serverSeed: string | null;
  clientSeed: string;
  crashPointScaled: number;
  currentMultiplierScaled: number;
  bettingEndsAt: Date | null;
  startedAt: Date | null;
  crashedAt: Date | null;
  settledAt: Date | null;
};

export class Round {
  private constructor(private props: RoundProps) {}

  static create(input: {
    id: string;
    seedHash: string;
    serverSeed: string;
    clientSeed: string;
    crashPointScaled: number;
  }): Round {
    return new Round({
      id: input.id,
      phase: ROUND_PHASES.WAITING_BETS,
      seedHash: input.seedHash,
      serverSeed: input.serverSeed,
      clientSeed: input.clientSeed,
      crashPointScaled: input.crashPointScaled,
      currentMultiplierScaled: 100,
      bettingEndsAt: null,
      startedAt: null,
      crashedAt: null,
      settledAt: null,
    });
  }

  static reconstitute(props: RoundProps): Round {
    return new Round(props);
  }

  get id(): string {
    return this.props.id;
  }

  get phase(): RoundPhase {
    return this.props.phase;
  }

  get seedHash(): string {
    return this.props.seedHash;
  }

  get serverSeed(): string | null {
    return this.props.serverSeed;
  }

  get clientSeed(): string {
    return this.props.clientSeed;
  }

  get crashPointScaled(): number {
    return this.props.crashPointScaled;
  }

  get currentMultiplierScaled(): number {
    return this.props.currentMultiplierScaled;
  }

  get bettingEndsAt(): Date | null {
    return this.props.bettingEndsAt;
  }

  get startedAt(): Date | null {
    return this.props.startedAt;
  }

  get crashedAt(): Date | null {
    return this.props.crashedAt;
  }

  get settledAt(): Date | null {
    return this.props.settledAt;
  }

  applySnapshot(snapshot: {
    phase: RoundPhase;
    currentMultiplierScaled: number;
    bettingEndsAt: number | null;
    runningStartedAt: number | null;
    crashedAt: number | null;
    settlingEndsAt: number | null;
    completedAt: number | null;
  }): void {
    this.props.phase = snapshot.phase;
    this.props.currentMultiplierScaled = snapshot.currentMultiplierScaled;
    this.props.bettingEndsAt =
      snapshot.bettingEndsAt === null ? null : new Date(snapshot.bettingEndsAt);
    this.props.startedAt =
      snapshot.runningStartedAt === null
        ? null
        : new Date(snapshot.runningStartedAt);
    this.props.crashedAt =
      snapshot.crashedAt === null ? null : new Date(snapshot.crashedAt);

    if (snapshot.phase === ROUND_PHASES.SETTLING && snapshot.settlingEndsAt) {
      this.props.settledAt = new Date(snapshot.settlingEndsAt);
    }

    if (snapshot.phase === ROUND_PHASES.COMPLETED && snapshot.completedAt) {
      this.props.settledAt = new Date(snapshot.completedAt);
    }
  }

  toProps(): RoundProps {
    return { ...this.props };
  }
}
