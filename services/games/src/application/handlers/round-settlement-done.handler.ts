import { Injectable } from "@nestjs/common";
import type { MessageEnvelope } from "@crash/messaging";
import { RoundEngineService } from "../services/round-engine.service";

export type RoundSettlementDonePayload = {
  roundId: string;
  idempotencyKey: string;
};

@Injectable()
export class RoundSettlementDoneHandler {
  constructor(private readonly roundEngine: RoundEngineService) {}

  async handle(
    envelope: MessageEnvelope<RoundSettlementDonePayload>,
  ): Promise<void> {
    await this.roundEngine.onSettlementDone(envelope.payload.roundId);
  }
}
