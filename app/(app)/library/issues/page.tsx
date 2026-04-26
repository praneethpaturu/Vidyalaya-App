import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDate, inr } from "@/lib/utils";
import { returnBook } from "@/app/actions/library";

export default async function IssuesPage() {
  const session = await auth();
  const u = session!.user as any;
  const issues = await prisma.bookIssue.findMany({
    where: { schoolId: u.schoolId },
    include: { book: true, copy: true, student: { include: { user: true } }, staff: { include: { user: true } } },
    orderBy: [{ returnedAt: "asc" }, { dueDate: "asc" }],
    take: 100,
  });
  const today = new Date();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page">Issues & returns</h1>
          <p className="muted mt-1">{issues.filter((i) => !i.returnedAt).length} open · {issues.length} total</p>
        </div>
        <Link href="/library" className="btn-outline">← Catalogue</Link>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Book</th><th>Copy</th><th>Borrower</th><th>Issued</th><th>Due</th><th>Returned</th><th className="text-right">Fine</th><th></th></tr></thead>
          <tbody>
            {issues.map((i) => {
              const overdue = !i.returnedAt && i.dueDate < today;
              return (
                <tr key={i.id}>
                  <td className="font-medium">{i.book.title}</td>
                  <td className="font-mono text-xs">{i.copy.barcode}</td>
                  <td>{i.student?.user.name ?? i.staff?.user.name ?? "—"}</td>
                  <td className="text-slate-600">{fmtDate(i.issuedAt)}</td>
                  <td className={overdue ? "text-rose-700 font-medium" : "text-slate-600"}>{fmtDate(i.dueDate)}</td>
                  <td className="text-slate-600">{i.returnedAt ? fmtDate(i.returnedAt) : <span className="badge-amber">Open</span>}</td>
                  <td className="text-right">{i.fineAmount > 0 ? <span className={i.finePaid ? "text-slate-600" : "text-rose-700 font-medium"}>{inr(i.fineAmount)}</span> : "—"}</td>
                  <td className="text-right">
                    {!i.returnedAt && (
                      <form action={returnBook.bind(null, i.id)} className="inline">
                        <button className="text-emerald-700 text-sm hover:underline">Mark returned</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {issues.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-slate-500">No book issues yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
