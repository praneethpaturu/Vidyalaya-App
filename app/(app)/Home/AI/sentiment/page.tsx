import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";

// Lightweight sentiment classifier — keyword + heuristic. Mirrors what the
// LLM stub returns so the page works offline.
function classify(text: string): { label: "POSITIVE" | "NEGATIVE" | "NEUTRAL"; score: number } {
  const negative = /(angry|upset|disappointed|worst|terrible|complain|delay|bad|missed|harass|rude|unfair|broken|leak|mistake|error|wrong|never)/i;
  const positive = /(thanks|great|excellent|happy|appreciat|pleased|satisfied|good|wonderful|kind|caring|grateful)/i;
  let label: "POSITIVE" | "NEGATIVE" | "NEUTRAL" = "NEUTRAL";
  if (positive.test(text)) label = "POSITIVE";
  if (negative.test(text)) label = "NEGATIVE";
  return { label, score: label === "NEGATIVE" ? -0.7 : label === "POSITIVE" ? 0.6 : 0.05 };
}

export default async function SentimentPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  const concerns = await prisma.concern.findMany({
    where: { schoolId: sId, status: { in: ["OPEN", "IN_PROGRESS"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const tagged = concerns.map((c) => {
    const cls = classify(`${c.subject} ${c.body}`);
    return { c, cls };
  });

  const negCount = tagged.filter((t) => t.cls.label === "NEGATIVE").length;
  const escalate = tagged
    .filter((t) => t.cls.label === "NEGATIVE" && t.c.severity !== "LOW")
    .slice(0, 20);

  return (
    <AIPageShell
      title="Concern Sentiment"
      subtitle="Open concerns ranked by sentiment + severity. Use this to triage who to call back first."
    >
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Open concerns" value={tagged.length} tone="bg-slate-100 text-slate-700" />
        <Stat label="Negative" value={negCount} tone="bg-rose-50 text-rose-700" />
        <Stat label="To escalate" value={escalate.length} tone="bg-amber-50 text-amber-700" />
      </div>

      <h2 className="h-section mb-2">Suggested escalation queue</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Sentiment</th>
              <th>Severity</th>
              <th>Subject</th>
              <th>Raised by</th>
              <th>Category</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {escalate.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-8">No high-severity negative concerns. ✓</td></tr>
            )}
            {escalate.map(({ c, cls }) => (
              <tr key={c.id}>
                <td>
                  <span className={cls.label === "NEGATIVE" ? "badge-red" : cls.label === "POSITIVE" ? "badge-green" : "badge-slate"}>
                    {cls.label}
                  </span>
                </td>
                <td>
                  <span className={c.severity === "HIGH" ? "badge-red" : c.severity === "LOW" ? "badge-slate" : "badge-amber"}>
                    {c.severity}
                  </span>
                </td>
                <td className="font-medium">{c.subject}</td>
                <td>{c.raisedByName}{c.anonymous ? " (anon)" : ""}</td>
                <td>{c.category}</td>
                <td className="text-xs">{c.createdAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AIPageShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="card card-pad">
      <div className={`inline-block px-2 py-0.5 rounded-full text-[11px] mb-1 ${tone}`}>{label}</div>
      <div className="text-3xl font-medium">{value}</div>
    </div>
  );
}
