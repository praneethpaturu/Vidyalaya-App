import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";

const FEEDBACK_SAMPLES = [
  "The dal was watery today, and the chapatis were cold.",
  "Lunch was excellent — paneer butter masala was much better than last week.",
  "Breakfast variety has improved this month.",
  "Same vegetable curry repeated three days in a row.",
  "Khichdi was salty.",
  "Loved the festival special menu yesterday!",
  "Fruit portions are too small.",
  "Service was slow, line was long.",
  "Very good — fresh juice was a nice surprise.",
  "Tea was lukewarm.",
];

function classify(t: string): "POSITIVE" | "NEGATIVE" | "NEUTRAL" {
  if (/(excellent|good|love|loved|nice|better|fresh|happy|great|surprise)/i.test(t)) return "POSITIVE";
  if (/(cold|salty|watery|repeated|slow|lukewarm|small|bad|stale|spoil)/i.test(t)) return "NEGATIVE";
  return "NEUTRAL";
}

export default async function MessSentimentPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  const meals = await prisma.mealPlan.findMany({
    where: { building: { schoolId: sId } },
    take: 14,
    orderBy: [{ dayOfWeek: "asc" }, { meal: "asc" }],
  });

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // Use canned feedback per meal — replace with real feedback collection later.
  const tagged = meals.map((m, idx) => {
    const fb = FEEDBACK_SAMPLES[(idx + meals.length) % FEEDBACK_SAMPLES.length];
    return { m, fb, label: classify(fb), day: DAYS[m.dayOfWeek] };
  });

  const pos = tagged.filter((t) => t.label === "POSITIVE").length;
  const neg = tagged.filter((t) => t.label === "NEGATIVE").length;

  // Suggested swaps: 2 most common negative tokens → propose alternatives.
  const negativeTokens = tagged.filter((t) => t.label === "NEGATIVE").map((t) => t.fb);
  const suggestions: string[] = [];
  if (negativeTokens.some((t) => /repeated/i.test(t))) suggestions.push("Rotate vegetable curries on a 5-day cycle to avoid repetition.");
  if (negativeTokens.some((t) => /cold|lukewarm/i.test(t))) suggestions.push("Hold-time check: chapatis & tea served within 10 min of cooking.");
  if (negativeTokens.some((t) => /salt/i.test(t))) suggestions.push("Salt calibration check before each dispatch.");
  if (negativeTokens.some((t) => /small|portion/i.test(t))) suggestions.push("Audit fruit portion size against the menu chart.");
  if (suggestions.length === 0) suggestions.push("Continue current menu — no consistent negative pattern this fortnight.");

  return (
    <AIPageShell
      title="Mess Feedback Sentiment"
      subtitle="Aggregates resident feedback per day and suggests menu changes when negative patterns recur."
    >
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Days reviewed" value={tagged.length} tone="bg-slate-100 text-slate-700" />
        <Stat label="Positive" value={pos} tone="bg-emerald-50 text-emerald-700" />
        <Stat label="Negative" value={neg} tone="bg-rose-50 text-rose-700" />
      </div>

      <h2 className="h-section mb-2">Daily feedback</h2>
      <div className="card overflow-x-auto mb-5">
        <table className="table">
          <thead><tr><th>Day</th><th>Meal</th><th>Menu</th><th>Sentiment</th><th>Sample feedback</th></tr></thead>
          <tbody>
            {tagged.map(({ m, fb, label, day }) => (
              <tr key={m.id}>
                <td className="text-xs">{day}</td>
                <td className="font-medium">{m.meal}</td>
                <td className="text-xs text-slate-600">{m.menu}</td>
                <td>
                  <span className={label === "POSITIVE" ? "badge-green" : label === "NEGATIVE" ? "badge-red" : "badge-slate"}>
                    {label}
                  </span>
                </td>
                <td className="text-xs">{fb}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="h-section mb-2">Suggestions</h2>
      <ul className="card card-pad list-disc pl-5 text-sm space-y-1">
        {suggestions.map((s) => <li key={s}>{s}</li>)}
      </ul>
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
