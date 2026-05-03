import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ApplicationsListPage({
  searchParams,
}: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sp = await searchParams;
  const where: any = { schoolId: u.schoolId };
  if (sp.status) where.status = sp.status;
  if (sp.q) {
    where.OR = [
      { applicationNo: { contains: sp.q, mode: "insensitive" } },
      { studentFirstName: { contains: sp.q, mode: "insensitive" } },
      { fatherName: { contains: sp.q, mode: "insensitive" } },
      { fatherPhone: { contains: sp.q } },
    ];
  }
  const [rows, byStatus] = await Promise.all([
    prisma.applicationForm.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.applicationForm.groupBy({ by: ["status"], where: { schoolId: u.schoolId }, _count: { _all: true } }),
  ]);
  const tally: Record<string, number> = {};
  for (const r of byStatus) tally[r.status] = r._count._all;

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="h-page">Applications</h1>
          <p className="muted">Application forms submitted post-enquiry or as direct admissions.</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/admissions/applications/export" className="btn-outline">Export CSV</a>
          <Link href="/Home/Admissions/applications/new" className="btn-primary flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New application
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {["", "OPEN", "ACCEPTED", "REJECTED", "ADMITTED", "CANCELLED"].map((s) => (
          <Link
            key={s}
            href={s ? `/Home/Admissions/applications?status=${s}` : "/Home/Admissions/applications"}
            className={`px-3 py-1 rounded-full text-xs ${
              (sp.status ?? "") === s ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {s || "All"} {s ? `(${tally[s] ?? 0})` : ""}
          </Link>
        ))}
      </div>

      <form className="card card-pad mb-3 flex gap-3 items-end">
        <div className="flex-1">
          <label className="label">Search</label>
          <input className="input" name="q" defaultValue={sp.q ?? ""} placeholder="Application no, name, phone" />
        </div>
        <input type="hidden" name="status" value={sp.status ?? ""} />
        <button className="btn-primary">Search</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>App #</th><th>Student</th><th>Class</th><th>Father</th><th>Phone</th>
              <th>Fee</th><th>Status</th><th>Created</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={9} className="text-center text-slate-500 py-8">No applications.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{r.applicationNo}</td>
                <td className="font-medium">{r.studentFirstName} {r.studentLastName ?? ""}</td>
                <td>{r.optingClassName ?? "—"}</td>
                <td>{r.fatherName ?? "—"}</td>
                <td className="font-mono text-xs">{r.fatherPhone ?? "—"}</td>
                <td className="text-xs">
                  {r.applicationFee > 0 ? `₹${(r.applicationFee / 100).toLocaleString("en-IN")}` : "—"}
                  {r.feePaid && <span className="badge-green ml-1">paid</span>}
                </td>
                <td>
                  <span className={
                    r.status === "ADMITTED" ? "badge-green" :
                    r.status === "ACCEPTED" ? "badge-blue" :
                    r.status === "REJECTED" || r.status === "CANCELLED" ? "badge-red" :
                    "badge-amber"
                  }>{r.status}</span>
                </td>
                <td className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="text-right"><Link href={`/Home/Admissions/applications/${r.id}`} className="text-brand-700 text-xs hover:underline">Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
