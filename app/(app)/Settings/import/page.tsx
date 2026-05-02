import { requirePageRole } from "@/lib/auth";
import { REGISTRY, entitiesInTier } from "@/lib/import/registry";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

const TIER_LABEL = {
  1: "Tier 1 — Foundation (import these first)",
  2: "Tier 2 — Operational masters",
  3: "Tier 3 — Historical data",
} as const;

export default async function ImportCenterPage() {
  const me = await requirePageRole(["ADMIN", "PRINCIPAL"]);

  // For each Tier-1 entity, count how many already exist so the admin can
  // see progress. Cheap counts, school-scoped.
  const counts: Record<string, number> = {};
  const sId = me.schoolId;
  counts.classes = await prisma.class.count({ where: { schoolId: sId } });
  counts.subjects = await prisma.subject.count({ where: { schoolId: sId } });
  counts.staff = await prisma.staff.count({ where: { schoolId: sId, deletedAt: null } });
  counts.students = await prisma.student.count({ where: { schoolId: sId, deletedAt: null } });
  counts.guardians = await prisma.guardian.count({ where: { schoolId: sId, deletedAt: null } });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Migration Center</h1>
      <p className="muted mb-6">
        Move your existing data to Vidyalaya. Each entity has a downloadable CSV template and an
        AI-assisted mapper that figures out which of your columns goes where. Import in
        dependency order: <strong>Classes → Staff → Students → Guardians</strong>, then
        operational masters, then historical data.
      </p>

      {[1, 2, 3].map((tier) => (
        <section key={tier} className="mb-8">
          <h2 className="h-section mb-3">{TIER_LABEL[tier as 1 | 2 | 3]}</h2>
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Entity</th>
                  <th className="text-left px-4 py-2 font-semibold">Depends on</th>
                  <th className="text-right px-4 py-2 font-semibold">Existing</th>
                  <th className="text-left px-4 py-2 font-semibold">Status</th>
                  <th className="text-right px-4 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entitiesInTier(tier as 1 | 2 | 3).map((e) => {
                  const blockedBy = e.dependsOn.filter((d) => (counts[d] ?? null) === 0);
                  const ready = e.status === "ready";
                  const existing = counts[e.key] ?? null;
                  return (
                    <tr key={e.key} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{e.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{e.description}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {e.dependsOn.length === 0 ? "—" : e.dependsOn.join(", ")}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-sm text-slate-700">
                        {existing != null ? existing : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {ready ? (
                          blockedBy.length ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs">
                              waiting on {blockedBy.join(", ")}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs">
                              ready
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
                            coming soon
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <a
                          href={`/api/import/${e.key}/template`}
                          className="text-xs text-brand-700 hover:underline mr-3"
                        >
                          Download template
                        </a>
                        {ready && !blockedBy.length ? (
                          <Link
                            href={`/Settings/import/${e.key}`}
                            className="inline-block px-3 py-1.5 rounded-lg bg-brand-700 text-white text-xs hover:bg-brand-800"
                          >
                            Import
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <div className="font-medium mb-1">How the import works</div>
        <ol className="list-decimal pl-5 space-y-1 text-blue-900/85">
          <li>Download the template for the entity, OR upload your existing system's CSV/Excel export as-is.</li>
          <li>The AI mapper reads your column headers + a few sample rows and proposes which of your columns maps to which of our fields.</li>
          <li>Review and adjust the mapping if needed (you can override any AI suggestion).</li>
          <li>Click <strong>Run import</strong> — we create rows one-by-one, skip duplicates, and report any per-row errors so you can fix and re-run.</li>
        </ol>
      </div>
    </div>
  );
}
