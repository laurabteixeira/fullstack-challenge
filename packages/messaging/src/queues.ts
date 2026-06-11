import { DOMAIN_EVENTS, type DomainEventType } from "./events";

export const QUEUE_NAMES = {
  [DOMAIN_EVENTS.BET_DEBIT_REQUESTED]: "crash-bet-debit-requested",
  [DOMAIN_EVENTS.BET_DEBITED]: "crash-bet-debited",
  [DOMAIN_EVENTS.BET_DEBIT_FAILED]: "crash-bet-debit-failed",
  [DOMAIN_EVENTS.BET_CANCELLED]: "crash-bet-cancelled",
  [DOMAIN_EVENTS.ROUND_SETTLED]: "crash-round-settled",
  [DOMAIN_EVENTS.ROUND_SETTLEMENT_DONE]: "crash-round-settlement-done",
} as const satisfies Record<DomainEventType, string>;

export function queueNameForEvent(eventType: DomainEventType): string {
  return QUEUE_NAMES[eventType];
}
