import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { KeycloakAuthService } from "./keycloak-auth.service";

export type AuthenticatedRequest = Request & { playerId?: string };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: KeycloakAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = authorization.slice("Bearer ".length);
    request.playerId = await this.authService.verifyAccessToken(token);
    return true;
  }
}
