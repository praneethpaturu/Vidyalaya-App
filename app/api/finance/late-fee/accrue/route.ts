import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loadSetting } from "@/lib/settings";

export const runtime = "nodejs";
export const maxDuration = 60;

// Daily cron — applies a configurable late fee to overdue invoices.
// Per-school config lives in the SchoolSetting bag under key "lateFee":
//   { enabled, perDay, gracePeriodDays, capPct }
// Defaults: 1% of outstanding balance per day, after a 3-day grace, capped at
// 10% of the invoice total.
//
// We track accrual on the invoice via Invoice.tax (we re-use that integer
// column to hold the accrued late fee in paise — keeps the schema small).
// Subtotal stays constant; the running total is recomputed each day so a
// later partial payment correctly reduces the accrual base.
//
// Auth: same dual-secret pattern as /api/digest:
//   Authorization: Bearer <CRON_SECRET>   ← Vercel cron
//   X-Digest-Token: <DIGEST_SECRET>       ← manual / curl

type Cfg = { enabled: boolean; perDay: number; gracePeriodDays: number; capPct: number };
const DEFAULT_CFG: Cfg = { enabled: false, perDay: 1, gracePeriodDays: 3, capPct: 10 };

async function authorize(req: Request): Promise<boolean> {
  const cronSecret   = process.env.CRON_SECRET;
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

  const today = new Date(); today.setHours(0, 0, 0, 0);

  // Process per-school so each school's lateFee config applies.
  const schools = await prisma.school.findMany({ select: { id: true } });
  const summary: { schoolId: string; touched: number; addedPaise: number; skipped: string }[] = [];

  for (const s of schools) {
    const cfg = await loadSetting<Cfg>(s.id, "lateFee", DEFAULT_CFG);
    if (!cfg.enabled || cfg.perDay <= 0) {
      summary.push({ schoolId: s.id, touched: 0, addedPaise: 0, skipped: "disabled" });
      continue;
    }
    const overdue = await prisma.invoice.findMany({
      where: {
        schoolId: s.id,
        status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] },
        dueDate: { lt: today },
      },
    });

    let touched = 0;
    let addedPaise = 0;
    for (const inv of overdue) {
      const balance = inv.total - inv.amountPaid;
      if (balance <= 0) continue;
      const daysLate = Math.floor((+today - +new Date(inv.dueDate)) / 86400000);
      if (daysLate <= cfg.gracePeriodDays) continue;

      // Today's increment (paise): perDay% of remaining balance, applied per
      // day. Cap accrual at capPct% of subtotal. We increment by ONE day per
      // run (idempotent on a daily cadence) — administrators who skip a few
      // days simply have a slower accrual.
      const dayIncrement = Math.round(balance * (cfg.perDay / 100));
      const cap = Math.round(inv.subtotal * (cfg.capPct / 100));
      const newAccrual = Math.min(cap, inv.tax + dayIncrement);
      if (newAccrual === inv.tax) continue;
      const delta = newAccrual - inv.tax;
      await prisma.invoice.update({
        where: { id: inv.id },
        data: {
          tax: newAccrual,
          total: inv.subtotal - inv.discount + newAccrual,
          status: "OVERDUE",
        },
      });
      touched++;
      addedPaise += delta;
    }
    summary.push({ schoolId: s.id, touched, addedPaise, skipped: "" });
  }

  return NextResponse.json({ ok: true, processedAt: today, summary });
}

export async function GET(req: Request)  { return run(req); }
export async function POST(req: Request) { return run(req); }
