import { prisma } from "@/lib/db";
import { requirePageRole } from "@/lib/auth";
import { initials } from "@/lib/utils";

export default async function PeopleDirectory() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const sId = u.schoolId;
  const [staff, students] = await Promise.all([
    prisma.staff.findMany({ where: { schoolId: sId }, include: { user: true }, orderBy: { employeeId: "asc" } }),
    prisma.student.findMany({ where: { schoolId: sId }, include: { user: true, class: true }, orderBy: { admissionNo: "asc" }, take: 200 }),
  ]);

  const byDept = staff.reduce<Record<string, typeof staff>>((acc, s) => {
    const k = s.department || "Other";
    (acc[k] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="h-page mb-1">People directory</h1>
      <p className="muted mb-6">{staff.length} staff · {students.length} students (showing first 200)</p>

      <h2 className="h-section mb-3">Staff by department</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {Object.entries(byDept).map(([dept, list]) => (
          <div key={dept} className="card">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="h-section">{dept}</h3>
              <span className="text-xs text-slate-500">{list.length}</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {list.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-medium">{initials(s.user.name)}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{s.user.name}</div>
                    <div className="text-xs text-slate-500">{s.designation} · {s.employeeId}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2 className="h-section mb-3">Students</h2>
      <div className="card">
        <table className="table">
          <thead><tr><th>Admission #</th><th>Name</th><th>Class</th><th>Roll</th><th>Gender</th></tr></thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td className="font-mono text-xs">{s.admissionNo}</td>
                <td>{s.user.name}</td>
                <td className="text-slate-600">{s.class?.name ?? "—"}</td>
                <td>{s.rollNo}</td>
                <td className="text-slate-600">{s.gender}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
