import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runPreset, type PresetKey, PRESETS } from "@/lib/reports/runner";

export const runtime = "nodejs";
export const maxDuration = 300;

// Picks every active ReportSubscription whose nextRunAt is now-or-earlier,
// computes the report, queues an email per recipient via MessageOutbox, then
// rolls nextRunAt forward by the cadence.

async function authorize(req: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const digestSecret = process.env.DIGEST_SECRET;
  if (!cronSecret && !digestSecret) return false;
  const authz = req.headers.get("authorization") ?? "";
  if (cronSecret && authz === `Bearer ${cronSecret}`) return true;
  if (digestSecret && req.headers.get("x-digest-token") === digestSecret) return true;
  return false;
}

function bumpNext(nextRunAt: Date, cadence: string): Date {
  const d = new Date(nextRunAt);
  if (cadence === "DAILY") d.setDate(d.getDate() + 1);
  else if (cadence === "MONTHLY") d.setMonth(d.getMonth() + 1);
  else d.setDate(d.getDate() + 7);
  d.setHours(2, 30, 0, 0);
  return d;
}

async function run(req: Request) {
  if (!(await authorize(req))) {
    return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
  }

  const due = await prisma.reportSubscription.findMany({
    where: { active: true, nextRunAt: { lte: new Date() } },
    take: 50,
  });
  let queued = 0;
  let errors: string[] = [];

  for (const sub of due) {
    try {
      if (!PRESETS.some((p) => p.key === sub.preset)) {
        errors.push(`${sub.id}: unknown preset ${sub.preset}`);
        continue;
      }
      const result = await runPreset(sub.preset as PresetKey, sub.schoolId);
      const recipients: string[] = (() => { try { return JSON.parse(sub.recipients); } catch { return []; } })();
      const subject = `[Vidyalaya] ${sub.name} — ${new Date().toLocaleDateString("en-IN")}`;
      const body = [
        `${sub.name}`,
        `${result.rows.length} row${result.rows.length !== 1 ? "s" : ""}`,
        ``,
        result.csv.split("\n").slice(0, 21).join("\n"),
        result.rows.length > 20 ? `\n... and ${result.rows.length - 20} more rows` : "",
      ].join("\n");

      for (const to of recipients) {
        await prisma.messageOutbox.create({
          data: {
            schoolId: sub.schoolId,
            channel: "EMAIL",
            toEmail: to,
            subject,
            body,
            status: "QUEUED",
          },
        });
        queued++;
      }

      // Persist a SavedReport audit row so it shows up in "Recently generated".
      await prisma.savedReport.create({
        data: {
          schoolId: sub.schoolId,
          name: `${sub.name} (auto)`,
          query: JSON.stringify({ preset: sub.preset, subscriptionId: sub.id }),
          result: JSON.stringify({ rowCount: result.rows.length }),
        },
      });

      await prisma.reportSubscription.update({
        where: { id: sub.id },
        data: { lastRunAt: new Date(), nextRunAt: bumpNext(sub.nextRunAt, sub.cadence) },
      });
    } catch (e: any) {
      errors.push(`${sub.id}: ${e?.message ?? e}`);
    }
  }

  return NextResponse.json({ ok: true, picked: due.length, queued, errors });
}

export async function GET(req: Request)  { return run(req); }
export async function POST(req: Request) { return run(req); }
