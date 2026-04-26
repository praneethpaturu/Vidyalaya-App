import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function LibraryAssessmentPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const [ranges, bands, assessments] = await Promise.all([
    prisma.lexileGradeRange.findMany({ where: { schoolId: sId } }),
    prisma.lexileBand.findMany({ where: { schoolId: sId } }),
    prisma.libraryAssessment.findMany({ where: { schoolId: sId }, orderBy: { conductedAt: "desc" }, take: 50 }),
  ]);
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Library Assessment</h1>
      <p className="muted mb-4">Lexile-style reading assessments. Grade-wise Lexile ranges and labelled bands.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <Card title="Grade-wise Lexile Ranges">
          <table className="table"><thead><tr><th>Class</th><th>Min</th><th>Max</th></tr></thead>
            <tbody>
              {ranges.length === 0 && <tr><td colSpan={3} className="text-center text-slate-500 py-6">No ranges set.</td></tr>}
              {ranges.map((r) => <tr key={r.id}><td>{r.classId}</td><td>{r.minLexile}L</td><td>{r.maxLexile}L</td></tr>)}
            </tbody>
          </table>
        </Card>
        <Card title="Lexile Bands">
          <table className="table"><thead><tr><th>Label</th><th>Min</th><th>Max</th></tr></thead>
            <tbody>
              {bands.length === 0 && <tr><td colSpan={3} className="text-center text-slate-500 py-6">No bands defined.</td></tr>}
              {bands.map((b) => <tr key={b.id}><td>{b.label}</td><td>{b.minLexile}L</td><td>{b.maxLexile}L</td></tr>)}
            </tbody>
          </table>
        </Card>
      </div>

      <h2 className="h-section mb-2">Assessment Groups & Parameters</h2>
      <div className="card card-pad mb-5">
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { g: "Comprehension", weight: "30%" },
            { g: "Vocabulary", weight: "25%" },
            { g: "Fluency", weight: "20%" },
            { g: "Reasoning", weight: "25%" },
          ].map((p) => (
            <li key={p.g} className="rounded-lg bg-slate-50 px-3 py-2.5">
              <div className="text-sm font-medium">{p.g}</div>
              <div className="text-xs text-slate-500">Weight: {p.weight}</div>
            </li>
          ))}
        </ul>
      </div>

      <h2 className="h-section mb-2">Recent assessments</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Student</th><th>Date</th><th>Lexile</th><th>Band</th><th>Recommendation</th></tr></thead>
          <tbody>
            {assessments.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-6">No Data Found</td></tr>}
            {assessments.map((a) => (
              <tr key={a.id}>
                <td className="font-mono text-xs">{a.studentId}</td>
                <td className="text-xs">{new Date(a.conductedAt).toLocaleDateString("en-IN")}</td>
                <td>{a.computedLexile}L</td>
                <td><span className="badge-blue">{a.band ?? "—"}</span></td>
                <td className="text-xs">{a.recommendation ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">{title}</div>
      {children}
    </div>
  );
}
