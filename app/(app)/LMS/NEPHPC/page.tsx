import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DOMAINS = ["PHYSICAL", "SOCIO_EMOTIONAL", "COGNITIVE", "LANGUAGE", "LIFE_SKILLS"];
const RUBRIC_LEVELS = ["STREAM", "PROFICIENT", "DEVELOPING", "EMERGING"];

export default async function NEPHPCPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const entries = await prisma.nEPHPCEntry.findMany({
    where: { schoolId: sId }, orderBy: { createdAt: "desc" }, take: 50,
  });
  const counts: Record<string, number> = {};
  DOMAINS.forEach((d) => counts[d] = 0);
  entries.forEach((e) => counts[e.domain] = (counts[e.domain] ?? 0) + 1);

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">NEP HPC — Holistic Progress Card</h1>
      <p className="muted mb-4">Domain-wise descriptors with multi-source input (self / peer / teacher / parent), term-wise compilation.</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {DOMAINS.map((d) => (
          <div key={d} className="card card-pad">
            <div className="text-[10px] uppercase font-semibold text-brand-700">{d.replace("_", " ")}</div>
            <div className="text-2xl font-medium">{counts[d] ?? 0}</div>
          </div>
        ))}
      </div>

      <h2 className="h-section mb-2">Recent entries</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Student</th><th>Term</th><th>Year</th><th>Domain</th><th>Source</th><th>Level</th><th>Descriptor</th></tr></thead>
          <tbody>
            {entries.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">No HPC entries yet.</td></tr>}
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="font-mono text-xs">{e.studentId}</td>
                <td>{e.term}</td>
                <td>{e.year}</td>
                <td><span className="badge-blue">{e.domain.replace("_", " ")}</span></td>
                <td><span className="badge-slate">{e.source}</span></td>
                <td>{e.rubricLevel ?? "—"}</td>
                <td className="text-xs">{e.descriptor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 card card-pad">
        <div className="text-sm font-medium mb-2">Rubric scale</div>
        <div className="flex gap-2 text-xs">
          {RUBRIC_LEVELS.map((r) => <span key={r} className="badge-blue">{r}</span>)}
        </div>
      </div>
    </div>
  );
}
