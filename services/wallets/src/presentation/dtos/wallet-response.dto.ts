export class WalletResponseDto {
  id: string;
  playerId: string;
  balanceCents: string;
}

export function toWalletResponseDto(wallet: {
  id: string;
  playerId: string;
  balanceCents: bigint;
}): WalletResponseDto {
  return {
    id: wallet.id,
    playerId: wallet.playerId,
    balanceCents: wallet.balanceCents.toString(),
  };
}
