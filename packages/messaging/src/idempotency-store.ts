/**
 * In-memory idempotency store for message consumers (scaffold).
 * Replace with persistent storage (e.g. DB) before production debit/credit handlers.
 */
export interface IdempotencyStore {
  has(key: string): boolean;
  mark(key: string): void;
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly processed = new Set<string>();

  has(key: string): boolean {
    return this.processed.has(key);
  }

  mark(key: string): void {
    this.processed.add(key);
  }
}
