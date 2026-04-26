import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";
import { rankBySimilarity } from "@/lib/ai";
import Link from "next/link";

export default async function SemanticSearchPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  let results: { kind: string; href: string; title: string; sub: string; score: number }[] = [];
  if (query) {
    const [students, books, announcements, concerns] = await Promise.all([
      prisma.student.findMany({
        where: { schoolId: sId },
        include: { user: true, class: true },
        take: 200,
      }),
      prisma.book.findMany({ where: { schoolId: sId }, take: 200 }),
      prisma.announcement.findMany({ where: { schoolId: sId }, take: 80 }),
      prisma.concern.findMany({ where: { schoolId: sId }, take: 80 }),
    ]);

    const sRanked = rankBySimilarity(
      query,
      students,
      (s) => `${s.user.name} ${s.admissionNo} ${s.class?.name ?? ""}`,
      6,
    ).map(({ item, score }) => ({
      kind: "Student", href: `/students/${item.id}`,
      title: item.user.name, sub: `${item.class?.name ?? "—"} · ${item.admissionNo}`, score,
    }));
    const bRanked = rankBySimilarity(
      query, books, (b) => `${b.title} ${b.author ?? ""} ${b.category ?? ""}`, 6,
    ).map(({ item, score }) => ({
      kind: "Book", href: `/Home/Library`, title: item.title,
      sub: `${item.author ?? "—"}${item.category ? ` · ${item.category}` : ""}`, score,
    }));
    const aRanked = rankBySimilarity(
      query, announcements, (a) => `${a.title} ${a.body}`, 4,
    ).map(({ item, score }) => ({
      kind: "Announcement", href: `/announcements`, title: item.title,
      sub: item.body.slice(0, 80), score,
    }));
    const cRanked = rankBySimilarity(
      query, concerns, (c) => `${c.subject} ${c.body} ${c.category}`, 4,
    ).map(({ item, score }) => ({
      kind: "Concern", href: `/Concerns`, title: item.subject,
      sub: `${item.category} · ${item.severity}`, score,
    }));
    results = [...sRanked, ...bRanked, ...aRanked, ...cRanked]
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);
  }

  return (
    <AIPageShell
      title="Semantic Search"
      subtitle="Search students, books, announcements and concerns in plain language. Falls back to keyword overlap when offline."
    >
      <form action="/Home/AI/semantic-search" method="GET" className="flex items-center gap-2 mb-4">
        <input
          name="q"
          defaultValue={query}
          placeholder='Try: "students whose attendance is dropping"  or  "books on monsoon"'
          className="flex-1 border rounded-md px-3 py-2 text-sm"
        />
        <button className="btn-primary">Search</button>
      </form>

      {results.length > 0 && (
        <div className="card divide-y divide-slate-100">
          {results.map((r, i) => (
            <Link key={i} href={r.href} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-slate-50">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-slate-500">{r.kind}</div>
                <div className="font-medium text-sm truncate">{r.title}</div>
                <div className="text-xs text-slate-500 truncate">{r.sub}</div>
              </div>
              <div className="text-[11px] text-slate-500 shrink-0 mt-1">{(r.score * 100).toFixed(0)}%</div>
            </Link>
          ))}
        </div>
      )}
      {query && results.length === 0 && (
        <div className="empty-state">No matches.</div>
      )}
      {!query && (
        <div className="text-sm text-slate-500">
          Type a question and hit Search. The result page works without an LLM key.
        </div>
      )}
    </AIPageShell>
  );
}
