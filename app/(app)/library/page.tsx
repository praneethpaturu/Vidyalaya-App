import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDate, inr } from "@/lib/utils";
import { Plus, BookOpen } from "lucide-react";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const session = await auth();
  const u = session!.user as any;
  const where: any = { schoolId: u.schoolId };
  if (sp.q) where.OR = [
    { title: { contains: sp.q } }, { author: { contains: sp.q } }, { isbn: { contains: sp.q } },
  ];
  const [books, openIssues] = await Promise.all([
    prisma.book.findMany({ where, orderBy: { title: "asc" }, take: 100 }),
    prisma.bookIssue.count({ where: { schoolId: u.schoolId, returnedAt: null } }),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page">Library</h1>
          <p className="muted mt-1">{books.length} titles · {openIssues} books currently issued</p>
        </div>
        <div className="flex gap-2">
          <Link href="/library/issues" className="btn-outline">Issue & return</Link>
        </div>
      </div>

      <form className="mb-4" action="/library">
        <input className="input max-w-md" name="q" defaultValue={sp.q ?? ""} placeholder="Search title, author, ISBN…" />
      </form>

      <div className="card">
        <table className="table">
          <thead><tr><th>Title</th><th>Author</th><th>Category</th><th>ISBN</th><th>Shelf</th><th className="text-right">Available</th></tr></thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id}>
                <td className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-brand-100 text-brand-700 grid place-items-center"><BookOpen className="w-4 h-4" /></div>
                    {b.title}
                  </div>
                </td>
                <td className="text-slate-600">{b.author ?? "—"}</td>
                <td>{b.category ? <span className="badge-slate">{b.category}</span> : "—"}</td>
                <td className="font-mono text-xs">{b.isbn ?? "—"}</td>
                <td className="text-slate-600">{b.shelfCode ?? "—"}</td>
                <td className={`text-right font-medium ${b.availableCopies === 0 ? "text-rose-700" : ""}`}>
                  {b.availableCopies} / {b.totalCopies}
                </td>
              </tr>
            ))}
            {books.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-slate-500">No books in catalogue yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
