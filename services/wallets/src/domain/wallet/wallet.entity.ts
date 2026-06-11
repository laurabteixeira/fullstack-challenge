import { InvalidAmountError } from "../errors/invalid-amount.error";
import { InsufficientBalanceError } from "../errors/insufficient-balance.error";
import { type Cents, assertPositiveCents } from "../money";

export type WalletProps = {
  id: string;
  playerId: string;
  balanceCents: Cents;
};

export class Wallet {
  private constructor(private props: WalletProps) {}

  static create(
    id: string,
    playerId: string,
    initialBalanceCents: Cents,
  ): Wallet {
    if (initialBalanceCents < 0n) {
      throw new InvalidAmountError("Initial balance cannot be negative");
    }

    return new Wallet({ id, playerId, balanceCents: initialBalanceCents });
  }

  static reconstitute(props: WalletProps): Wallet {
    return new Wallet(props);
  }

  get id(): string {
    return this.props.id;
  }

  get playerId(): string {
    return this.props.playerId;
  }

  get balanceCents(): Cents {
    return this.props.balanceCents;
  }

  debit(amountCents: Cents): void {
    assertPositiveCents(amountCents);

    if (this.props.balanceCents < amountCents) {
      throw new InsufficientBalanceError();
    }

    this.props.balanceCents -= amountCents;
  }

  credit(amountCents: Cents): void {
    assertPositiveCents(amountCents);
    this.props.balanceCents += amountCents;
  }
}
