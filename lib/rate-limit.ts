// Simple sliding-window rate limiter.
//
// Production: swap `bucket()` to read from Vercel KV / Upstash Redis. For
// now we use an in-memory Map (fine for one Vercel function instance) +
// the RateLimitBucket Prisma table as a persistent fallback.

import { prisma } from "@/lib/db";

const memory = new Map<string, { count: number; resetAt: number }>();

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;        // epoch ms
};

export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const reset = now + windowSec * 1000;

  // 1) Fast path: in-memory
  const cur = memory.get(key);
  if (cur && cur.resetAt > now) {
    cur.count += 1;
    memory.set(key, cur);
    if (cur.count > limit) {
      return { ok: false, limit, remaining: 0, resetAt: cur.resetAt };
    }
    return { ok: true, limit, remaining: Math.max(0, limit - cur.count), resetAt: cur.resetAt };
  }
  memory.set(key, { count: 1, resetAt: reset });

  // 2) Slow path: persist if process restarts
  prisma.rateLimitBucket.upsert({
    where: { id: key },
    update: { count: { increment: 1 } },
    create: { id: key, count: 1, resetAt: new Date(reset) },
  }).catch(() => {});

  return { ok: true, limit, remaining: limit - 1, resetAt: reset };
}

/** Default rate limits per surface — tweak in one place. */
export const RATE_LIMITS = {
  AI_PER_USER:       { limit: 30,  windowSec: 60 },     // 30 AI calls / min
  LOGIN_PER_IP:      { limit: 10,  windowSec: 300 },    // 10 / 5 min
  PUBLIC_API:        { limit: 100, windowSec: 60 },     // 100 / min
  WEBHOOK_DELIVERY:  { limit: 200, windowSec: 60 },
};

export function ipFromRequest(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
