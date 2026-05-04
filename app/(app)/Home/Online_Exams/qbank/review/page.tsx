import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ReviewClient from "./ReviewClient";

export const dynamic = "force-dynamic";

export default async function QbankReviewPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const sp = await searchParams;

  // Show counts per status so empty tabs are obvious; default to whichever
  // bucket has items (so the page isn't blank by default).
  const counts = await prisma.questionBankItem.groupBy({
    by: ["status"],
    where: { schoolId: u.schoolId },
    _count: { _all: true },
  });
  const countMap: Record<string, number> = {};
  counts.forEach((c) => { countMap[c.status] = c._count._all; });
  const defaultStatus =
    sp.status ??
    (countMap.REVIEW ? "REVIEW" :
     countMap.DRAFT ? "DRAFT" :
     countMap.PUBLISHED ? "PUBLISHED" :
     "DRAFT");
  const status = defaultStatus;

  const [items, reviewers] = await Promise.all([
    prisma.questionBankItem.findMany({
      where: { schoolId: u.schoolId, status },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.user.findMany({
      where: { schoolId: u.schoolId, role: { in: ["ADMIN", "PRINCIPAL", "TEACHER"] }, active: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Question bank review</h1>
      <p className="muted mb-4">BRD §4.1 — Draft → Review → Published workflow with reviewer assignment. Total bank: {Object.values(countMap).reduce((s, n) => s + n, 0)} items.</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {(["DRAFT", "REVIEW", "PUBLISHED", "RETIRED"] as const).map((s) => (
          <a key={s} href={`/Home/Online_Exams/qbank/review?status=${s}`}
             className={`text-xs px-3 py-1 rounded-full ${status === s ? "bg-brand-700 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
            {s} ({countMap[s] ?? 0})
          </a>
        ))}
      </div>

      <ReviewClient
        items={items.map((i) => ({
          id: i.id, text: i.text, type: i.type, marks: i.marks, difficulty: i.difficulty,
          topic: i.topic, subtopic: i.subtopic, status: i.status, source: i.source,
          options: (() => { try { return JSON.parse(i.options); } catch { return []; } })(),
          correct: i.correct,
          createdAt: i.createdAt.toISOString(),
        }))}
        reviewers={reviewers}
        currentStatus={status}
      />
    </div>
  );
}
