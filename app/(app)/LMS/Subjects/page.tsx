import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function SubjectsManagementPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const [classSubjects, masters] = await Promise.all([
    prisma.subject.findMany({
      where: { schoolId: sId },
      include: { class: true, teacher: { include: { user: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.subjectMaster.findMany({ where: { schoolId: sId }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Subjects Management</h1>
      <p className="muted mb-4">Subject masters, theory/practical split, credit hours, mapping to Boards/Classes.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Subject Masters">
          <table className="table">
            <thead><tr><th>Code</th><th>Name</th><th>Theory</th><th>Practical</th><th>Credits</th><th>Boards</th></tr></thead>
            <tbody>
              {masters.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-6">None defined.</td></tr>}
              {masters.map((m) => (
                <tr key={m.id}>
                  <td className="font-mono text-xs">{m.code}</td>
                  <td className="font-medium">{m.name}</td>
                  <td>{m.hasTheory ? "Yes" : "No"}</td>
                  <td>{m.hasPractical ? "Yes" : "No"}</td>
                  <td>{m.creditHours}</td>
                  <td className="text-xs">{m.boardCsv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Class-Subject mapping">
          <table className="table">
            <thead><tr><th>Class</th><th>Subject</th><th>Code</th><th>Teacher</th></tr></thead>
            <tbody>
              {classSubjects.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-6">None.</td></tr>}
              {classSubjects.map((s) => (
                <tr key={s.id}>
                  <td>{s.class.name}</td>
                  <td className="font-medium">{s.name}</td>
                  <td className="font-mono text-xs">{s.code}</td>
                  <td>{s.teacher?.user.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
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
