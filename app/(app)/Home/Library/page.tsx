import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

type SP = { window?: "today" | "7d" | "30d" };

export default async function LibraryDaySheetPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const win = sp.window ?? "today";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sId = u.schoolId;

  const since =
    win === "7d" ? new Date(Date.now() - 7 * 86400000)
    : win === "30d" ? new Date(Date.now() - 30 * 86400000)
    : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

  const [issues, returns, fines, books] = await Promise.all([
    prisma.bookIssue.findMany({
      where: { schoolId: sId, issuedAt: { gte: since } },
      include: { book: true, student: { include: { user: true, class: true } }, staff: { include: { user: true } } },
      orderBy: { issuedAt: "desc" }, take: 50,
    }),
    prisma.bookIssue.findMany({
      where: { schoolId: sId, returnedAt: { gte: since } },
      include: { book: true, student: { include: { user: true } }, staff: { include: { user: true } } },
      orderBy: { returnedAt: "desc" }, take: 50,
    }),
    prisma.bookIssue.aggregate({
      where: { schoolId: sId, fineAmount: { gt: 0 } },
      _sum: { fineAmount: true }, _count: true,
    }),
    prisma.book.count({ where: { schoolId: sId } }),
  ]);

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Library — Day Sheet</h1>
          <p className="muted">Issue, return, renew, reserve. {books} books in catalogue.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/library" className="btn-outline">Catalogue</Link>
          <Link href="/library/issues" className="btn-tonal">All Issues</Link>
        </div>
      </div>

      <div className="card card-pad mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="label">Branch</label>
          <select className="input"><option>Main</option></select>
        </div>
        <div>
          <label className="label">Library</label>
          <select className="input"><option>Main Library</option></select>
        </div>
        <div>
          <label className="label">Time window</label>
          <div className="flex gap-1">
            {[
              { k: "today", l: "Today" },
              { k: "7d", l: "Last 7 days" },
              { k: "30d", l: "This 30 days" },
            ].map(({ k, l }) => (
              <Link
                key={k}
                href={`/Home/Library?window=${k}`}
                className={`px-3 py-1.5 text-xs rounded-full border ${win === k ? "bg-brand-50 text-brand-700 border-brand-200" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >{l}</Link>
            ))}
          </div>
        </div>
        <div className="text-right">
          <Link href="/library/issue" className="btn-primary">Issue Book</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Issued</div><div className="text-2xl font-medium">{issues.length}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Returned</div><div className="text-2xl font-medium">{returns.length}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Fines collected</div><div className="text-2xl font-medium">{inr(fines._sum.fineAmount ?? 0)}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Active fines</div><div className="text-2xl font-medium">{fines._count}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">Recent Issues</div>
          <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {issues.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">No Data Found</li>}
            {issues.map((i) => (
              <li key={i.id} className="px-4 py-2.5 text-sm">
                <div className="flex justify-between">
                  <div className="font-medium truncate">{i.book.title}</div>
                  <div className="text-xs text-slate-500">{new Date(i.issuedAt).toLocaleDateString("en-IN")}</div>
                </div>
                <div className="text-xs text-slate-500">
                  to {i.student?.user.name ?? i.staff?.user.name ?? "—"} · due {new Date(i.dueDate).toLocaleDateString("en-IN")}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">Recent Returns</div>
          <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {returns.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">No Data Found</li>}
            {returns.map((r) => (
              <li key={r.id} className="px-4 py-2.5 text-sm">
                <div className="flex justify-between">
                  <div className="font-medium truncate">{r.book.title}</div>
                  <div className="text-xs text-slate-500">{r.returnedAt && new Date(r.returnedAt).toLocaleDateString("en-IN")}</div>
                </div>
                <div className="text-xs text-slate-500">
                  by {r.student?.user.name ?? r.staff?.user.name ?? "—"} · {r.fineAmount > 0 ? <span className="text-rose-600">Fine {inr(r.fineAmount)}</span> : "On time"}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
