import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";
import { flagAnomalies } from "@/lib/ai";

export default async function CrossModuleAnomalyPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  const since = new Date(Date.now() - 30 * 86400000);

  // 1) Login spikes — daily login event count.
  const logins = await prisma.loginEvent.findMany({
    where: { schoolId: sId, loggedAt: { gte: since } },
    select: { loggedAt: true, userId: true },
  });
  const loginByDay = new Array(30).fill(0);
  for (const l of logins) {
    const idx = Math.floor((l.loggedAt.getTime() - since.getTime()) / 86400000);
    if (idx >= 0 && idx < 30) loginByDay[idx]++;
  }
  const loginAnomalyDays = flagAnomalies(loginByDay, 2.0);

  // 2) Fee receipt spikes — daily payment count.
  const payments = await prisma.payment.findMany({
    where: { schoolId: sId, paidAt: { gte: since }, status: "SUCCESS" },
    select: { paidAt: true, amount: true },
  });
  const payByDay = new Array(30).fill(0);
  const amtByDay = new Array(30).fill(0);
  for (const p of payments) {
    const idx = Math.floor((p.paidAt.getTime() - since.getTime()) / 86400000);
    if (idx >= 0 && idx < 30) { payByDay[idx]++; amtByDay[idx] += p.amount; }
  }
  const payAnomalyDays = flagAnomalies(payByDay, 2.0);
  const amtAnomalyDays = flagAnomalies(amtByDay, 2.0);

  // 3) Concerns surge — daily concern count.
  const concerns = await prisma.concern.findMany({
    where: { schoolId: sId, createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const concernByDay = new Array(30).fill(0);
  for (const c of concerns) {
    const idx = Math.floor((c.createdAt.getTime() - since.getTime()) / 86400000);
    if (idx >= 0 && idx < 30) concernByDay[idx]++;
  }
  const concernAnomalyDays = flagAnomalies(concernByDay, 2.0);

  function dayLabel(idx: number) {
    const d = new Date(since.getTime() + idx * 86400000);
    return d.toISOString().slice(5, 10);
  }

  const cards: { title: string; days: number[]; max: number; series: number[]; anomalies: number[] }[] = [
    { title: "Logins / day", days: loginByDay.map((_, i) => i), max: Math.max(1, ...loginByDay), series: loginByDay, anomalies: loginAnomalyDays },
    { title: "Receipts / day", days: payByDay.map((_, i) => i), max: Math.max(1, ...payByDay), series: payByDay, anomalies: payAnomalyDays },
    { title: "Receipt amounts (count of paise)", days: amtByDay.map((_, i) => i), max: Math.max(1, ...amtByDay), series: amtByDay.map((a) => Math.round(a / 1000)), anomalies: amtAnomalyDays },
    { title: "Concerns / day", days: concernByDay.map((_, i) => i), max: Math.max(1, ...concernByDay), series: concernByDay, anomalies: concernAnomalyDays },
  ];

  return (
    <AIPageShell
      title="Cross-module Anomalies"
      subtitle="Days where logins, receipts, fee amounts or concerns deviate >2σ from the 30-day baseline. Investigate flagged dates."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.title} className="card card-pad">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">{c.title}</div>
              <div className="text-[11px] text-slate-500">{c.anomalies.length} flagged</div>
            </div>
            <div className="flex items-end gap-0.5 h-32">
              {c.series.map((v, i) => (
                <div
                  key={i}
                  title={`${dayLabel(i)} — ${v}`}
                  className={`flex-1 rounded-t ${c.anomalies.includes(i) ? "bg-rose-500" : "bg-brand-200"}`}
                  style={{ height: `${(v / c.max) * 100}%` }}
                />
              ))}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
              <span>{dayLabel(0)}</span>
              <span>{dayLabel(c.series.length - 1)}</span>
            </div>
            {c.anomalies.length > 0 && (
              <div className="text-xs text-slate-600 mt-2">
                Flagged: {c.anomalies.map((i) => dayLabel(i)).join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </AIPageShell>
  );
}
