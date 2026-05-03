import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CollectPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  // List students with outstanding invoices.
  const students = await prisma.student.findMany({
    where: {
      schoolId: u.schoolId, deletedAt: null,
      ...(q ? {
        OR: [
          { admissionNo: { contains: q, mode: "insensitive" } },
          { user: { name: { contains: q, mode: "insensitive" } } },
        ],
      } : {}),
    },
    include: {
      user: true, class: true,
      _count: { select: { invoices: { where: { status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] } } } } },
    },
    orderBy: { admissionNo: "asc" },
    take: 100,
  });

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Collect fees</h1>
          <p className="muted">Record cash / cheque / UPI / NEFT payments against student invoices.</p>
        </div>
        <Link href="/Home/Finance" className="btn-outline">← Finance home</Link>
      </div>

      <form className="card card-pad mb-4 flex gap-3 items-end">
        <div className="flex-1">
          <label className="label">Search student</label>
          <input className="input" name="q" defaultValue={q} placeholder="Admission no or name" />
        </div>
        <button className="btn-primary">Search</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Adm no</th><th>Name</th><th>Class</th><th>Outstanding invoices</th><th></th></tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr><td colSpan={5} className="text-center text-slate-500 py-8">No students match.</td></tr>
            )}
            {students.map((s) => (
              <tr key={s.id}>
                <td className="font-mono text-xs">{s.admissionNo}</td>
                <td>{s.user.name}</td>
                <td>{s.class?.name ?? "—"}</td>
                <td>
                  {s._count.invoices > 0
                    ? <span className="badge-amber">{s._count.invoices}</span>
                    : <span className="text-xs text-slate-500">All clear</span>}
                </td>
                <td className="text-right">
                  <Link href={`/Home/Finance/collect/${s.id}`} className="text-brand-700 text-xs hover:underline">
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
