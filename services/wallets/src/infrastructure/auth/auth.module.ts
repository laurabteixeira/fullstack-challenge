import { Module } from "@nestjs/common";
import { KeycloakAuthService } from "./keycloak-auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Module({
  providers: [KeycloakAuthService, JwtAuthGuard],
  exports: [KeycloakAuthService, JwtAuthGuard],
})
export class AuthModule {}
