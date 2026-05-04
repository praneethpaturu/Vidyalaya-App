import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// BRD personas — Platform Admin: cross-tenant content authority. We re-use
// the existing User.role = "PLATFORM_ADMIN" string. Auth wrapper checks the
// role; data here is unscoped by school deliberately (this is the only
// surface that should ever see across tenants).
export default async function PlatformAdminPage() {
  const u = await requirePageRole(["PLATFORM_ADMIN"]);
  void u;

  const [schoolCount, schools, plans, qbankCounts, totalAttempts] = await Promise.all([
    prisma.school.count(),
    prisma.school.findMany({
      select: { id: true, name: true, code: true, planKey: true, planExpiresAt: true, createdAt: true },
      orderBy: { createdAt: "desc" }, take: 100,
    }),
    prisma.subscriptionPlan.findMany({ orderBy: { pricePerMonth: "asc" } }),
    prisma.questionBankItem.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.onlineExamAttempt.count(),
  ]);

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <h1 className="h-page mb-1">Platform admin</h1>
      <p className="muted mb-4">Cross-tenant governance — global question bank, tenant licensing, plan oversight.</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <Stat label="Tenants" value={schoolCount} />
        <Stat label="Total attempts (lifetime)" value={totalAttempts} />
        <Stat label="QBank · published" value={qbankCounts.find((q) => q.status === "PUBLISHED")?._count._all ?? 0} />
        <Stat label="QBank · draft+review" value={(qbankCounts.find((q) => q.status === "DRAFT")?._count._all ?? 0) + (qbankCounts.find((q) => q.status === "REVIEW")?._count._all ?? 0)} />
      </div>

      <h2 className="h-section mb-2">Tenants</h2>
      <div className="card overflow-x-auto mb-5">
        <table className="table">
          <thead><tr><th>Code</th><th>Name</th><th>Plan</th><th>Plan expires</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {schools.map((s) => (
              <tr key={s.id}>
                <td className="font-mono text-xs">{s.code}</td>
                <td>{s.name}</td>
                <td><span className="badge-blue text-xs">{s.planKey}</span></td>
                <td className="text-xs">{s.planExpiresAt ? new Date(s.planExpiresAt).toLocaleDateString("en-IN") : <em className="text-slate-400">never</em>}</td>
                <td className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="text-right"><a href={`/Platform/tenants/${s.id}`} className="text-xs text-brand-700 hover:underline">Manage →</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="h-section mb-2">Subscription plans</h2>
      <div className="card overflow-x-auto mb-5">
        <table className="table">
          <thead><tr><th>Key</th><th>Name</th><th>Price / month</th><th>Features</th></tr></thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs">{p.key}</td>
                <td>{p.name}</td>
                <td>₹{(p.pricePerMonth / 100).toLocaleString("en-IN")}</td>
                <td className="text-xs text-slate-500 font-mono whitespace-pre-wrap break-all">{p.features}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="h-section mb-2">Global question bank</h2>
      <p className="text-sm text-slate-600 mb-2">Questions with <code>schoolId = null</code> are visible to every tenant. Use them to seed JEE/NEET patterns.</p>
      <a href="/Platform/qbank" className="btn-primary text-sm">Manage global qbank →</a>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card card-pad">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-medium tracking-tight">{value.toLocaleString("en-IN")}</div>
    </div>
  );
}
