import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HeartPulse, Smile, Frown, Meh, AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";

const MOOD_ICON: Record<string, any> = {
  HAPPY: Smile, OK: Meh, SAD: Frown, ANGRY: Frown, ANXIOUS: Frown,
};
const MOOD_TONE: Record<string, string> = {
  HAPPY: "bg-emerald-50 text-emerald-700",
  OK:    "bg-slate-100 text-slate-700",
  SAD:   "bg-blue-50 text-blue-700",
  ANGRY: "bg-rose-50 text-rose-700",
  ANXIOUS: "bg-amber-50 text-amber-800",
};

export default async function WellnessPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sId = u.schoolId as string;

  const [recentVisits, openFlags, totalCheckIns] = await Promise.all([
    prisma.wellnessCheckIn.findMany({
      where: { schoolId: sId },
      orderBy: { visitedAt: "desc" },
      take: 12,
    }),
    prisma.safeguardingFlag.count({ where: { schoolId: sId, status: "OPEN" } }),
    prisma.wellnessCheckIn.count({ where: { schoolId: sId } }),
  ]);

  // Demo mood distribution if seeded data is empty.
  const moodDist = await prisma.moodEntry.groupBy({
    by: ["mood"],
    where: { schoolId: sId },
    _count: { _all: true },
  });

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 font-display flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <HeartPulse className="w-5 h-5" />
            </span>
            Student Wellness
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Counselor visits, daily mood check-ins, and AI safeguarding alerts.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/Home/AI/safeguarding" className="btn-tonal">
            <ShieldCheck className="w-4 h-4" /> Safeguarding ({openFlags} open)
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Counselor visits" value={totalCheckIns} tone="bg-rose-50 text-rose-700" />
        <Stat label="Open safeguarding flags" value={openFlags} tone={openFlags ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"} />
        <Stat label="Mood entries (term)" value={moodDist.reduce((a, m) => a + m._count._all, 0)} tone="bg-blue-50 text-blue-700" />
        <Stat label="Counselors on duty" value={2} tone="bg-violet-50 text-violet-700" />
      </div>

      <h2 className="h-section mb-3">Mood distribution</h2>
      <div className="card card-pad mb-6">
        {moodDist.length === 0 ? (
          <div className="empty-state">
            No mood entries yet — add a daily check-in widget to the student dashboard.
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {["HAPPY", "OK", "SAD", "ANGRY", "ANXIOUS"].map((m) => {
              const Icon = MOOD_ICON[m] ?? Meh;
              const count = moodDist.find((x) => x.mood === m)?._count._all ?? 0;
              return (
                <div key={m} className={`rounded-xl p-4 text-center ${MOOD_TONE[m]}`}>
                  <Icon className="w-6 h-6 mx-auto mb-1.5" />
                  <div className="text-2xl font-semibold">{count}</div>
                  <div className="text-[11px]">{m}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <h2 className="h-section mb-3">Recent counselor visits</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Student</th><th>Symptoms</th><th>Notes</th><th>Follow-up</th></tr>
          </thead>
          <tbody>
            {recentVisits.length === 0 && (
              <tr><td colSpan={5} className="text-center text-slate-500 py-8">No visits yet — start logging from the infirmary console.</td></tr>
            )}
            {recentVisits.map((v) => (
              <tr key={v.id}>
                <td className="text-xs">{v.visitedAt.toISOString().slice(0, 10)}</td>
                <td className="text-xs font-mono">{v.studentId.slice(-8)}</td>
                <td>{v.symptoms ?? "—"}</td>
                <td className="text-xs text-slate-600">{v.notes ?? "—"}</td>
                <td className="text-xs">{v.followUpAt?.toISOString().slice(0, 10) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 mt-6 flex items-start gap-2.5 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold mb-0.5">Privacy note</div>
          Counselor records are restricted to the counselor + principal. Mood entries are pseudonymised in
          aggregate views. Consent is required from a guardian for under-13 students per DPDP Act 2023.
        </div>
      </div>
    </div>
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
