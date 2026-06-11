export class DuplicateIdempotencyKeyError extends Error {
  constructor() {
    super("Idempotency key already processed");
    this.name = "DuplicateIdempotencyKeyError";
  }
}
