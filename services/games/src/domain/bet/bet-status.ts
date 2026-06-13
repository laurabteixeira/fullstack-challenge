export const BET_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  CASHED_OUT: "CASHED_OUT",
  LOST: "LOST",
  REJECTED: "REJECTED",
} as const;

export type BetStatus = (typeof BET_STATUS)[keyof typeof BET_STATUS];
