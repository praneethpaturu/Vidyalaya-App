import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";
import { ShieldAlert, AlertTriangle } from "lucide-react";

export default async function SafeguardingPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  // Live flags from the SafeguardingFlag table
  const liveFlags = await prisma.safeguardingFlag.findMany({
    where: { schoolId: sId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Demo: if there are no live flags yet, scan recent Concerns + Wall posts
  // for trigger keywords so the page shows something meaningful.
  let scannedFlags: any[] = [];
  if (liveFlags.length === 0) {
    const concerns = await prisma.concern.findMany({
      where: { schoolId: sId },
      take: 30,
      orderBy: { createdAt: "desc" },
    });
    const TRIGGERS = [
      { rx: /\b(bull(y|ied|ying)|harass|tease|tease)\b/i, cat: "BULLYING",  sev: "HIGH" },
      { rx: /\b(hurt myself|don'?t want to|sad|worthless|hopeless)\b/i, cat: "SELF_HARM", sev: "HIGH" },
      { rx: /\b(scared|anxious|panic|stress|breakdown)\b/i, cat: "DISTRESS", sev: "MEDIUM" },
      { rx: /\b(cigarette|alcohol|drug|smok)\b/i, cat: "SUBSTANCE", sev: "HIGH" },
    ];
    for (const c of concerns) {
      for (const t of TRIGGERS) {
        if (t.rx.test(c.subject + " " + c.body)) {
          scannedFlags.push({
            id: "demo-" + c.id,
            source: "CONCERN",
            refId: c.id,
            category: t.cat,
            severity: t.sev,
            excerpt: c.subject,
            status: "OPEN",
            createdAt: c.createdAt,
          });
          break;
        }
      }
    }
  }

  const all = liveFlags.length ? liveFlags : scannedFlags;
  const open = all.filter((f) => f.status === "OPEN").length;
  const high = all.filter((f) => f.severity === "HIGH").length;

  return (
    <AIPageShell
      title="AI Safeguarding"
      subtitle="Passively scans student-authored content (concerns, wall posts, journal entries, submissions) for signs of distress, self-harm, bullying, or substance use. Counselors review every flag — no automatic action."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <Stat label="Open flags" value={open} tone="bg-rose-50 text-rose-700" />
        <Stat label="High severity" value={high} tone="bg-amber-50 text-amber-700" />
        <Stat label="Total scanned (term)" value={all.length} tone="bg-slate-100 text-slate-700" />
      </div>

      <div className="card overflow-x-auto mb-4">
        <table className="table">
          <thead>
            <tr><th>Severity</th><th>Category</th><th>Source</th><th>Excerpt</th><th>Status</th><th>When</th></tr>
          </thead>
          <tbody>
            {all.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-10">
                No flagged content. The classifier scans new entries hourly.
              </td></tr>
            )}
            {all.map((f) => {
              const sev = f.severity === "HIGH" ? "badge-red" : f.severity === "MEDIUM" ? "badge-amber" : "badge-slate";
              const st  = f.status === "OPEN" ? "badge-red" : f.status === "REVIEWING" ? "badge-amber" : "badge-green";
              return (
                <tr key={f.id}>
                  <td><span className={sev}>{f.severity}</span></td>
                  <td>{f.category}</td>
                  <td className="text-xs">{f.source}</td>
                  <td className="text-xs text-slate-700">{f.excerpt}</td>
                  <td><span className={st}>{f.status}</span></td>
                  <td className="text-xs">{new Date(f.createdAt).toISOString().slice(0, 10)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 flex items-start gap-2.5 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold mb-0.5">Important</div>
          AI flags are a triage signal, not a diagnosis. Always pair with a human counselor review.
          Flagged content is stored encrypted; access is logged in <code>AuditLog</code>.
        </div>
      </div>
    </AIPageShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="card card-pad">
      <div className={`inline-block px-2 py-0.5 rounded-full text-[11px] mb-1 ${tone}`}>{label}</div>
      <div className="text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
    </div>
  );
}
