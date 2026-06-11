import { DOMAIN_EVENTS, type DomainEventType } from "./events";

const domainEventValues = new Set<string>(Object.values(DOMAIN_EVENTS));

export function isDomainEventType(value: string): value is DomainEventType {
  return domainEventValues.has(value);
}

/** Queue used by health checks across services. */
export const HEALTH_CHECK_EVENT = DOMAIN_EVENTS.BET_DEBIT_REQUESTED;
