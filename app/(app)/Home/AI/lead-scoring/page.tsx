import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";
import { scoreLead, pct } from "@/lib/ai";
import { fmtDate } from "@/lib/utils";

export default async function LeadScoringPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  const enquiries = await prisma.admissionEnquiry.findMany({
    where: { schoolId: sId },
    include: { interactions: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Approximate sibling lookup once for the whole list.
  const phones = enquiries.map((e) => e.parentPhone).filter(Boolean) as string[];
  const guardianUsers = await prisma.user.findMany({
    where: { schoolId: sId, phone: { in: phones } },
    select: { phone: true },
  });
  const knownPhones = new Set(guardianUsers.map((g) => g.phone!).filter(Boolean));

  const scored = enquiries.map((e) => {
    const last = e.interactions[0];
    const days = last
      ? Math.floor((Date.now() - last.createdAt.getTime()) / 86400000)
      : 999;
    const followUps = e.interactions.length;
    const result = scoreLead({
      source: e.source,
      followUps,
      daysSinceLastFollowUp: days,
      hasSibling: knownPhones.has(e.parentPhone),
      feeAffordabilityScore: e.applicationFee > 0 ? 0.7 : 0.4,
      status: e.status,
    });
    return { e, result, days, followUps };
  });
  scored.sort((a, b) => b.result.score - a.result.score);

  const high = scored.filter((s) => s.result.band === "HIGH").length;
  const med = scored.filter((s) => s.result.band === "MEDIUM").length;
  const low = scored.length - high - med;

  return (
    <AIPageShell
      title="Lead Scoring"
      subtitle="Conversion probability per admission enquiry. Counsellors keep their existing workflow — this is a re-rank only."
    >
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card label="High intent" value={high} tone="bg-emerald-50 text-emerald-700" />
        <Card label="Medium" value={med} tone="bg-amber-50 text-amber-700" />
        <Card label="Low" value={low} tone="bg-slate-100 text-slate-700" />
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Score</th>
              <th>Child</th>
              <th>Grade</th>
              <th>Source</th>
              <th>Stage</th>
              <th>Follow-ups</th>
              <th>Last contact</th>
              <th>Reasons</th>
            </tr>
          </thead>
          <tbody>
            {scored.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-500 py-8">No enquiries yet.</td></tr>
            )}
            {scored.slice(0, 100).map(({ e, result, days, followUps }) => (
              <tr key={e.id}>
                <td>
                  <span className={
                    result.band === "HIGH" ? "badge-green"
                      : result.band === "MEDIUM" ? "badge-amber" : "badge-slate"
                  }>
                    {pct(result.score)}
                  </span>
                </td>
                <td className="font-medium">{e.childName}</td>
                <td>{e.expectedGrade}</td>
                <td>{e.source}</td>
                <td>{e.status}</td>
                <td>{followUps}</td>
                <td className="text-xs">{days >= 999 ? "—" : `${days}d ago`}</td>
                <td className="text-xs text-slate-600">{result.reasons.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AIPageShell>
  );
}

function Card({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="card card-pad">
      <div className={`inline-block px-2 py-0.5 rounded-full text-[11px] mb-1 ${tone}`}>{label}</div>
      <div className="text-3xl font-medium">{value}</div>
    </div>
  );
}
