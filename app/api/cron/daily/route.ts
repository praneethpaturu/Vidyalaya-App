import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

// Daily multi-job dispatcher.
// Vercel Hobby allows only 2 cron entries, so we run our daily jobs
// (outbox flush, late-fee accrual, drip campaign fire) sequentially from a
// single endpoint. Each underlying handler enforces its own auth — we forward
// the same Authorization header / X-Digest-Token we received.
//
// Auth: same dual-secret pattern as the underlying handlers.

const JOBS: Array<{ name: string; path: string }> = [
  { name: "outbox-flush",   path: "/api/outbox/flush"            },
  { name: "late-fee",       path: "/api/finance/late-fee/accrue" },
  { name: "drip-fire",      path: "/api/connect/drip/fire"       },
];

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

  // Forward the same auth header to each underlying handler. We resolve the
  // base URL from the incoming request so this works in preview + production.
  const url = new URL(req.url);
  const base = `${url.protocol}//${url.host}`;
  const headers: Record<string, string> = { "content-type": "application/json" };
  const authz = req.headers.get("authorization");
  if (authz) headers["authorization"] = authz;
  const digestTok = req.headers.get("x-digest-token");
  if (digestTok) headers["x-digest-token"] = digestTok;

  const results: any[] = [];
  for (const job of JOBS) {
    const start = Date.now();
    try {
      const r = await fetch(`${base}${job.path}`, { method: "POST", headers });
      const body = await r.json().catch(() => ({}));
      results.push({ job: job.name, status: r.status, took: Date.now() - start, body });
    } catch (e: any) {
      results.push({ job: job.name, error: e?.message ?? String(e), took: Date.now() - start });
    }
  }
  return NextResponse.json({ ok: true, results });
}

export async function GET(req: Request)  { return run(req); }
export async function POST(req: Request) { return run(req); }
