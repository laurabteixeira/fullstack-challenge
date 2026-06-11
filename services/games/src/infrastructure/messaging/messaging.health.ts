import { Injectable } from "@nestjs/common";
import {
  HEALTH_CHECK_EVENT,
  createSqsClient,
  getQueueUrl,
  loadSqsConfigFromEnv,
  queueNameForEvent,
} from "@crash/messaging";

@Injectable()
export class MessagingHealthService {
  async check(): Promise<"ok" | "degraded"> {
    try {
      const client = createSqsClient(loadSqsConfigFromEnv());
      await getQueueUrl(
        client,
        queueNameForEvent(HEALTH_CHECK_EVENT),
      );
      return "ok";
    } catch {
      return "degraded";
    }
  }
}
