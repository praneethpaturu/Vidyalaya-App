// API-key auth for the public /api/v1/* surface.

import crypto from "crypto";
import { prisma } from "@/lib/db";

const HEADER = "x-vidyalaya-key";

export type ApiKeyAuth = {
  schoolId: string;
  scopes: string[];
  keyId: string;
};

export async function authenticateApiKey(req: Request): Promise<ApiKeyAuth | null> {
  const raw = req.headers.get(HEADER) ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!raw) return null;
  const prefix = raw.slice(0, 8);
  const hashed = crypto.createHash("sha256").update(raw).digest("hex");

  const row = await prisma.apiKey.findUnique({ where: { prefix } });
  if (!row || row.revokedAt) return null;
  if (row.hashedKey !== hashed) return null;

  // Best-effort lastUsedAt update — non-blocking.
  prisma.apiKey.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  return {
    schoolId: row.schoolId,
    scopes: row.scopes.split(",").map((s) => s.trim()).filter(Boolean),
    keyId: row.id,
  };
}

export function requireScope(auth: ApiKeyAuth, scope: string): boolean {
  return auth.scopes.includes(scope) || auth.scopes.includes("admin");
}

/** Generate a fresh key. Show ONCE to the creator; only the hash is stored. */
export function generateApiKey(): { plaintext: string; prefix: string; hashed: string } {
  const plain = "vid_" + crypto.randomBytes(24).toString("base64url");
  const prefix = plain.slice(0, 8);
  const hashed = crypto.createHash("sha256").update(plain).digest("hex");
  return { plaintext: plain, prefix, hashed };
}
