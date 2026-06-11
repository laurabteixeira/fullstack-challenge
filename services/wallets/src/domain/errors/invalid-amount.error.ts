export class InvalidAmountError extends Error {
  constructor(message = "Invalid amount") {
    super(message);
    this.name = "InvalidAmountError";
  }
}
