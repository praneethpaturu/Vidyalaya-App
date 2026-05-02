import crypto from "crypto";

export type TokenType = "INVITE" | "VERIFY_EMAIL" | "PASSWORD_RESET";

const TTL_MS: Record<TokenType, number> = {
  INVITE: 7 * 24 * 60 * 60 * 1000,        // 7 days
  VERIFY_EMAIL: 24 * 60 * 60 * 1000,       // 24 hours
  PASSWORD_RESET: 60 * 60 * 1000,          // 60 minutes
};

export function randomToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function expiryFor(type: TokenType): Date {
  return new Date(Date.now() + TTL_MS[type]);
}
