import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";
import { rankBySimilarity } from "@/lib/ai";

export default async function BookRecommendPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  const [students, books] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId: sId },
      include: {
        user: true,
        class: true,
        bookIssues: { include: { book: true }, take: 10, orderBy: { issuedAt: "desc" } },
      },
      take: 24,
    }),
    prisma.book.findMany({ where: { schoolId: sId }, take: 200 }),
  ]);

  return (
    <AIPageShell
      title="Book Recommendations"
      subtitle="For each student, semantically similar titles to what they've borrowed recently. Falls back to popular books for new readers."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {students.map((s) => {
          const seed = s.bookIssues
            .map((bi) => `${bi.book.title} ${bi.book.author ?? ""} ${bi.book.category ?? ""}`)
            .join(" ");
          const candidates = books.filter(
            (b) => !s.bookIssues.find((bi) => bi.bookId === b.id),
          );
          const recommended = seed
            ? rankBySimilarity(seed, candidates, (b) => `${b.title} ${b.author ?? ""} ${b.category ?? ""}`, 5)
            : candidates.slice(0, 5).map((item) => ({ item, score: 0 }));
          return (
            <div key={s.id} className="card card-pad">
              <div className="flex items-end justify-between mb-2">
                <div>
                  <div className="font-medium">{s.user.name}</div>
                  <div className="text-xs text-slate-500">{s.class?.name ?? "—"} · {s.bookIssues.length} past issue(s)</div>
                </div>
              </div>
              <ul className="text-sm space-y-1">
                {recommended.map(({ item, score }) => (
                  <li key={item.id} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {item.author ?? "—"}{item.category ? ` · ${item.category}` : ""}
                      </div>
                    </div>
                    {score > 0 && <span className="text-[10px] text-slate-500 ml-2">{(score * 100).toFixed(0)}%</span>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </AIPageShell>
  );
}
