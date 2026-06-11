import { Module } from "@nestjs/common";
import { MessagingModule } from "./infrastructure/messaging/messaging.module";
import { WalletsController } from "./presentation/controllers/wallets.controller";

@Module({
  imports: [MessagingModule],
  controllers: [WalletsController],
})
export class AppModule {}
