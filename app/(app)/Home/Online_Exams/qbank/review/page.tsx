import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ReviewClient from "./ReviewClient";

export const dynamic = "force-dynamic";

export default async function QbankReviewPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const sp = await searchParams;
  const status = sp.status ?? "REVIEW";

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
      <p className="muted mb-4">BRD §4.1 — Draft → Review → Published workflow with reviewer assignment.</p>

      <div className="flex gap-1 mb-3">
        {["DRAFT", "REVIEW", "PUBLISHED", "RETIRED"].map((s) => (
          <a key={s} href={`/Home/Online_Exams/qbank/review?status=${s}`}
             className={`text-xs px-3 py-1 rounded-full ${status === s ? "bg-brand-700 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
            {s} {items.length > 0 && status === s ? `(${items.length})` : ""}
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
