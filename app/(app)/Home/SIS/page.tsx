import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type SearchParams = { class?: string; status?: string; q?: string };

export default async function SISEnrollmentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const session = await auth();
  const sId = (session!.user as any).schoolId;

  const classes = await prisma.class.findMany({
    where: { schoolId: sId }, orderBy: [{ grade: "asc" }, { section: "asc" }],
  });

  const where: any = { schoolId: sId };
  if (sp.class) where.classId = sp.class;
  if (sp.q) {
    where.OR = [
      { admissionNo: { contains: sp.q } },
      { rollNo: { contains: sp.q } },
      { user: { name: { contains: sp.q } } },
    ];
  }
  const students = await prisma.student.findMany({
    where, include: { user: true, class: true }, take: 100, orderBy: { admissionNo: "asc" },
  });

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="h-page">Enrollments</h1>
          <p className="muted">Search by Admission No / Name / Class. Add, edit, bulk import.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" disabled title="Demo: bulk import">Bulk Import</button>
          <button className="btn-primary" disabled title="Demo: add student">+ Add Student</button>
        </div>
      </div>

      <form className="card card-pad mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="label">Search</label>
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Adm No / Roll / Name" className="input" />
        </div>
        <div>
          <label className="label">Class</label>
          <select name="class" defaultValue={sp.class ?? ""} className="input">
            <option value="">All</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select name="status" defaultValue={sp.status ?? ""} className="input">
            <option value="">Any</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>TC Issued</option>
            <option>Withdrawn</option>
            <option>Suspended</option>
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn-primary w-full">Apply</button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Adm No</th>
              <th>Roll</th>
              <th>Name</th>
              <th>Class</th>
              <th>Gender</th>
              <th>DOB</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-500 py-8">No Data Found</td></tr>
            )}
            {students.map((s) => (
              <tr key={s.id}>
                <td className="font-mono text-xs">{s.admissionNo}</td>
                <td>{s.rollNo}</td>
                <td className="font-medium">{s.user.name}</td>
                <td>{s.class?.name ?? "—"}</td>
                <td>{s.gender}</td>
                <td className="text-xs text-slate-600">{new Date(s.dob).toLocaleDateString("en-IN")}</td>
                <td><span className="badge-green">Active</span></td>
                <td className="text-right">
                  <Link href={`/students/${s.id}`} className="text-brand-700 text-xs hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-100">
          Showing {students.length} of {students.length} students.
          <span className="ml-3 text-slate-400">CSV / Excel / PDF export buttons attach here.</span>
        </div>
      </div>
    </div>
  );
}
