import { Module } from "@nestjs/common";
import { MessagingModule } from "./infrastructure/messaging/messaging.module";
import { GamesController } from "./presentation/controllers/games.controller";

@Module({
  imports: [MessagingModule],
  controllers: [GamesController],
})
export class AppModule {}
