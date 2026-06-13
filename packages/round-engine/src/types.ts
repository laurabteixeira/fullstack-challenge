export const ROUND_PHASES = {
  WAITING_BETS: "WAITING_BETS",
  RUNNING: "RUNNING",
  CRASHED: "CRASHED",
  SETTLING: "SETTLING",
  COMPLETED: "COMPLETED",
} as const;

export type RoundPhase = (typeof ROUND_PHASES)[keyof typeof ROUND_PHASES];

export type RoundEngineConfig = {
  bettingDurationMs: number;
  tickIntervalMs: number;
  multiplierGrowthPerSecond: number;
  settlingDurationMs: number;
};

export type RoundSnapshot = {
  roundId: string;
  phase: RoundPhase;
  crashPointScaled: number;
  currentMultiplierScaled: number;
  bettingEndsAt: number | null;
  runningStartedAt: number | null;
  crashedAt: number | null;
  settlingEndsAt: number | null;
  completedAt: number | null;
};
