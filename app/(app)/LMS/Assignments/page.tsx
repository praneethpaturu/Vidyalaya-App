import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function LMSAssignmentsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const assignments = await prisma.assignment.findMany({
    where: { class: { schoolId: sId } },
    include: { class: true, subject: true, teacher: { include: { user: true } }, _count: { select: { submissions: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <h1 className="h-page text-slate-700">Assignments</h1>
        <Link href="/classes" className="btn-tonal text-sm">Open Classes</Link>
      </div>
      <p className="muted mb-4">Per Class/Section/Subject. Submissions by status, on-time vs late, score distribution.</p>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Title</th><th>Class</th><th>Subject</th><th>Teacher</th><th>Due</th><th>Type</th><th>Submissions</th><th>Status</th></tr>
          </thead>
          <tbody>
            {assignments.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-mcb-red font-medium">No Data Found</td></tr>}
            {assignments.map((a) => (
              <tr key={a.id}>
                <td className="font-medium">
                  <Link href={`/classes/${a.classId}/work/${a.id}`} className="text-brand-700 hover:underline">{a.title}</Link>
                </td>
                <td>{a.class.name}</td>
                <td>{a.subject?.name ?? "—"}</td>
                <td className="text-xs">{a.teacher.user.name}</td>
                <td className="text-xs">{a.dueAt ? new Date(a.dueAt).toLocaleDateString("en-IN") : "—"}</td>
                <td><span className="badge-blue">{a.type}</span></td>
                <td>{a._count.submissions}</td>
                <td>
                  <span className={a.status === "PUBLISHED" ? "badge-green" : "badge-slate"}>{a.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
