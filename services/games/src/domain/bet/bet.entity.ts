import { type Cents, payoutFromBet } from "../money";
import { BET_STATUS, type BetStatus } from "./bet-status";

export type BetProps = {
  id: string;
  roundId: string;
  playerId: string;
  amountCents: Cents;
  status: BetStatus;
  cashoutMultiplierScaled: number | null;
  payoutCents: Cents | null;
  idempotencyKey: string;
};

export class Bet {
  private constructor(private props: BetProps) {}

  static createPending(input: {
    id: string;
    roundId: string;
    playerId: string;
    amountCents: Cents;
    idempotencyKey: string;
  }): Bet {
    return new Bet({
      ...input,
      status: BET_STATUS.PENDING,
      cashoutMultiplierScaled: null,
      payoutCents: null,
    });
  }

  static reconstitute(props: BetProps): Bet {
    return new Bet(props);
  }

  get id(): string {
    return this.props.id;
  }

  get roundId(): string {
    return this.props.roundId;
  }

  get playerId(): string {
    return this.props.playerId;
  }

  get amountCents(): Cents {
    return this.props.amountCents;
  }

  get status(): BetStatus {
    return this.props.status;
  }

  get cashoutMultiplierScaled(): number | null {
    return this.props.cashoutMultiplierScaled;
  }

  get payoutCents(): Cents | null {
    return this.props.payoutCents;
  }

  get idempotencyKey(): string {
    return this.props.idempotencyKey;
  }

  activate(): void {
    if (this.props.status !== BET_STATUS.PENDING) {
      throw new Error("Only pending bets can be activated");
    }
    this.props.status = BET_STATUS.ACTIVE;
  }

  reject(): void {
    if (this.props.status !== BET_STATUS.PENDING) {
      throw new Error("Only pending bets can be rejected");
    }
    this.props.status = BET_STATUS.REJECTED;
  }

  cashOut(multiplierScaled: number): void {
    if (this.props.status !== BET_STATUS.ACTIVE) {
      throw new Error("Only active bets can cash out");
    }

    this.props.status = BET_STATUS.CASHED_OUT;
    this.props.cashoutMultiplierScaled = multiplierScaled;
    this.props.payoutCents = payoutFromBet(this.props.amountCents, multiplierScaled);
  }

  markLost(): void {
    if (this.props.status !== BET_STATUS.ACTIVE) {
      return;
    }

    this.props.status = BET_STATUS.LOST;
    this.props.payoutCents = 0n;
  }

  toProps(): BetProps {
    return { ...this.props };
  }
}
