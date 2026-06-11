import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTVerifyGetKey,
} from "jose";
import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class KeycloakAuthService {
  private jwks: JWTVerifyGetKey | null = null;

  private getJwks(): JWTVerifyGetKey {
    if (!this.jwks) {
      const jwksUri = process.env.KEYCLOAK_JWKS_URI;
      if (!jwksUri) {
        throw new Error("KEYCLOAK_JWKS_URI is not configured");
      }
      this.jwks = createRemoteJWKSet(new URL(jwksUri));
    }
    return this.jwks;
  }

  async verifyAccessToken(token: string): Promise<string> {
    const issuer = process.env.KEYCLOAK_ISSUER;
    if (!issuer) {
      throw new Error("KEYCLOAK_ISSUER is not configured");
    }

    try {
      const { payload } = await jwtVerify(token, this.getJwks(), { issuer });
      if (typeof payload.sub !== "string" || payload.sub.length === 0) {
        throw new UnauthorizedException("Invalid token subject");
      }
      return payload.sub;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
