import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";
import { scoreDelinquency, pct } from "@/lib/ai";
import { inr } from "@/lib/utils";

export default async function FeeDelinquencyPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  const invoices = await prisma.invoice.findMany({
    where: { schoolId: sId, status: { in: ["ISSUED", "DUE", "PARTIAL"] } },
    include: { student: { include: { user: true, class: true } } },
    take: 200,
  });

  const studentIds = invoices.map((i) => i.studentId);
  const [allInvoices, concessions, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: { studentId: { in: studentIds } },
      select: { studentId: true, status: true, dueDate: true },
    }),
    prisma.studentConcession.findMany({
      where: { studentId: { in: studentIds }, status: "ACTIVE" },
      select: { studentId: true },
    }),
    prisma.payment.findMany({
      where: { invoice: { studentId: { in: studentIds } }, status: "FAILED" },
      select: { invoice: { select: { studentId: true } } },
    }),
  ]);

  const concSet = new Set(concessions.map((c) => c.studentId));
  const bouncedMap = new Map<string, number>();
  for (const p of payments) {
    if (p.invoice?.studentId)
      bouncedMap.set(p.invoice.studentId, (bouncedMap.get(p.invoice.studentId) ?? 0) + 1);
  }
  const regularityMap = new Map<string, number>();
  const hist = new Map<string, { paid: number; total: number }>();
  for (const inv of allInvoices) {
    const c = hist.get(inv.studentId) ?? { paid: 0, total: 0 };
    c.total++;
    if (inv.status === "PAID") c.paid++;
    hist.set(inv.studentId, c);
  }
  for (const [k, v] of hist) regularityMap.set(k, v.total ? v.paid / v.total : 1);

  const today = Date.now();
  const scored = invoices.map((inv) => {
    const overdue = Math.max(0, Math.floor((today - inv.dueDate.getTime()) / 86400000));
    const r = scoreDelinquency({
      outstandingPaise: inv.total - inv.amountPaid,
      daysOverdue: overdue,
      pastBouncedCount: bouncedMap.get(inv.studentId) ?? 0,
      paymentRegularity: regularityMap.get(inv.studentId) ?? 0.8,
      hasConcession: concSet.has(inv.studentId),
    });
    return { inv, r, overdue };
  });
  scored.sort((a, b) => b.r.score - a.r.score);

  const high = scored.filter((s) => s.r.band === "HIGH").length;

  return (
    <AIPageShell
      title="Fee Delinquency"
      subtitle="Risk score per outstanding invoice. Use the suggested action — never an automatic dunning message."
    >
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="High risk" value={high} tone="bg-rose-50 text-rose-700" />
        <Stat label="Outstanding invoices" value={scored.length} tone="bg-slate-100 text-slate-700" />
        <Stat
          label="Total outstanding"
          value={inr(scored.reduce((a, b) => a + (b.inv.total - b.inv.amountPaid), 0))}
          tone="bg-amber-50 text-amber-700"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Risk</th>
              <th>Student</th>
              <th>Class</th>
              <th>Invoice</th>
              <th>Outstanding</th>
              <th>Overdue</th>
              <th>Suggested action</th>
            </tr>
          </thead>
          <tbody>
            {scored.slice(0, 80).map(({ inv, r, overdue }) => (
              <tr key={inv.id}>
                <td>
                  <span className={r.band === "HIGH" ? "badge-red" : r.band === "MEDIUM" ? "badge-amber" : "badge-slate"}>
                    {pct(r.score)}
                  </span>
                </td>
                <td className="font-medium">{inv.student.user.name}</td>
                <td>{inv.student.class?.name ?? "—"}</td>
                <td className="text-xs">{inv.number}</td>
                <td>{inr(inv.total - inv.amountPaid)}</td>
                <td className="text-xs">{overdue ? `${overdue}d` : "—"}</td>
                <td className="text-xs text-slate-600">{suggest(r.band, overdue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AIPageShell>
  );
}

function suggest(band: string, overdue: number): string {
  if (band === "HIGH") return overdue > 60 ? "Counsellor call + payment plan" : "Personal call from accountant";
  if (band === "MEDIUM") return "Reminder on parent's preferred channel";
  return "Standard reminder";
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className="card card-pad">
      <div className={`inline-block px-2 py-0.5 rounded-full text-[11px] mb-1 ${tone}`}>{label}</div>
      <div className="text-2xl font-medium">{value}</div>
    </div>
  );
}
