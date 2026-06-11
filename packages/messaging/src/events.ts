export const DOMAIN_EVENTS = {
  BET_DEBIT_REQUESTED: "bet.debit_requested",
  BET_DEBITED: "bet.debited",
  BET_DEBIT_FAILED: "bet.debit_failed",
  BET_CANCELLED: "bet.cancelled",
  ROUND_SETTLED: "round.settled",
  ROUND_SETTLEMENT_DONE: "round.settlement_done",
} as const;

export type DomainEventType =
  (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];
