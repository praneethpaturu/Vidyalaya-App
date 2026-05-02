import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deliver } from "@/lib/notify";

export const runtime = "nodejs";
export const maxDuration = 60;

// Outbox dispatcher loop. Picks up to BATCH_SIZE oldest QUEUED rows,
// retries each one (deliver() inside lib/notify writes status SENT or
// FAILED). After MAX_ATTEMPTS we leave the row FAILED with the last
// error message — the dispatcher will not pick it up again until an
// operator manually requeues it.
//
// Auth: same dual-secret pattern as /api/digest:
//   * Authorization: Bearer <CRON_SECRET>   ← Vercel cron
//   * X-Digest-Token: <DIGEST_SECRET>       ← manual / curl
// At least one of the two env vars must be set or the route refuses.

const BATCH_SIZE   = 50;
const MAX_ATTEMPTS = 3;

async function authorize(req: Request): Promise<boolean> {
  const cronSecret   = process.env.CRON_SECRET;
  const digestSecret = process.env.DIGEST_SECRET;
  if (!cronSecret && !digestSecret) return false;
  const authz = req.headers.get("authorization") ?? "";
  if (cronSecret   && authz === `Bearer ${cronSecret}`) return true;
  if (digestSecret && req.headers.get("x-digest-token") === digestSecret) return true;
  return false;
}

async function run(req: Request) {
  if (!(await authorize(req))) {
    return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
  }

  // Pick the oldest QUEUED rows that haven't exceeded the retry cap.
  const queued = await prisma.messageOutbox.findMany({
    where: { status: "QUEUED", attempts: { lt: MAX_ATTEMPTS } },
    orderBy: { queuedAt: "asc" },
    take: BATCH_SIZE,
    select: { id: true, attempts: true },
  });

  let sent = 0;
  let failed = 0;
  let stillQueued = 0;
  const errors: string[] = [];

  for (const row of queued) {
    try {
      await deliver(row.id);
      // deliver() updates the row in-place. Re-read to know the outcome.
      const after = await prisma.messageOutbox.findUnique({
        where: { id: row.id },
        select: { status: true, error: true },
      });
      if (after?.status === "SENT") sent++;
      else if (after?.status === "FAILED") {
        failed++;
        if (errors.length < 10 && after.error) errors.push(after.error);
      } else stillQueued++;
    } catch (e: any) {
      // deliver() should swallow its own errors; this catches any leak.
      failed++;
      const msg = e?.message ?? String(e);
      if (errors.length < 10) errors.push(msg);
      await prisma.messageOutbox.update({
        where: { id: row.id },
        data: { error: msg, attempts: row.attempts + 1 },
      }).catch(() => {});
    }
  }

  return NextResponse.json({
    ok: true,
    picked: queued.length,
    sent,
    failed,
    stillQueued,
    errors,
    batchSize: BATCH_SIZE,
    maxAttempts: MAX_ATTEMPTS,
  });
}

export async function GET(req: Request)  { return run(req); }
export async function POST(req: Request) { return run(req); }
