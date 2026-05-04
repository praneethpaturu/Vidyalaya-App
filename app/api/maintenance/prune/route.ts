import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

// Prune expired / orphaned data so tables don't grow without bound.
// Called daily from /api/cron/daily. Auth follows the same dual-secret
// pattern as the dispatcher — we accept either a Bearer CRON_SECRET or
// the X-Digest-Token header.
async function authorize(req: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const digestSecret = process.env.DIGEST_SECRET;
  if (!cronSecret && !digestSecret) return false;
  const authz = req.headers.get("authorization") ?? "";
  if (cronSecret && authz === `Bearer ${cronSecret}`) return true;
  if (digestSecret && req.headers.get("x-digest-token") === digestSecret) return true;
  return false;
}

async function run(req: Request) {
  if (!(await authorize(req))) {
    return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
  }

  const now = new Date();
  // Stale rate-limit buckets — anything past resetAt is dead state.
  const expiredBuckets = await prisma.rateLimitBucket.deleteMany({
    where: { resetAt: { lt: now } },
  });

  // Stale offline-sync entries that have been applied + are older than 7 days.
  const old = new Date(now.getTime() - 7 * 86400_000);
  const appliedSync = await prisma.offlineSyncEntry.deleteMany({
    where: { applied: true, receivedAt: { lt: old } },
  });

  // Orphan OnlineAnswerLog rows — schema has no FK back to attempt, so
  // when an exam is deleted the cascading wipe of OnlineExamAttempt
  // leaves these audit rows behind. Prune anything whose attempt no
  // longer exists.
  const orphanLogs = await prisma.$executeRaw`
    DELETE FROM "OnlineAnswerLog"
    WHERE NOT EXISTS (
      SELECT 1 FROM "OnlineExamAttempt"
      WHERE "OnlineExamAttempt"."id" = "OnlineAnswerLog"."attemptId"
    )
  `;

  return NextResponse.json({
    ok: true,
    pruned: {
      rateLimitBuckets: expiredBuckets.count,
      offlineSyncEntries: appliedSync.count,
      orphanAnswerLogs: orphanLogs,
    },
  });
}

export async function GET(req: Request)  { return run(req); }
export async function POST(req: Request) { return run(req); }
