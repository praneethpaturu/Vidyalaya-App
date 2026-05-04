import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AppealsClient from "./AppealsClient";

export const dynamic = "force-dynamic";

export default async function AppealsQueuePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const sp = await searchParams;
  const status = sp.status ?? "OPEN";

  const counts = await prisma.onlineExamAppeal.groupBy({
    by: ["status"],
    where: { exam: { schoolId: u.schoolId } },
    _count: { _all: true },
  });
  const countMap: Record<string, number> = {};
  counts.forEach((c) => { countMap[c.status] = c._count._all; });

  const appeals = await prisma.onlineExamAppeal.findMany({
    where: { exam: { schoolId: u.schoolId }, status },
    include: { exam: true, attempt: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  // Resolve question text + student name in 2 batched lookups.
  const qIds = Array.from(new Set(appeals.map((a) => a.questionId)));
  const sIds = Array.from(new Set(appeals.map((a) => a.studentId)));
  const [questions, students] = await Promise.all([
    prisma.onlineQuestion.findMany({ where: { id: { in: qIds } }, select: { id: true, text: true, marks: true, type: true } }),
    prisma.student.findMany({ where: { id: { in: sIds } }, select: { id: true, admissionNo: true, user: { select: { name: true } } } }),
  ]);
  const qMap = new Map(questions.map((q) => [q.id, q]));
  const sMap = new Map(students.map((s) => [s.id, s]));

  const totalAll = Object.values(countMap).reduce((s, n) => s + n, 0);

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Re-grade appeals</h1>
      <p className="muted mb-4">
        BRD §4.3 — review student appeals; uphold (with mark delta) or reject.
        {totalAll === 0 && " No appeals filed yet — students can appeal a question from their result view."}
      </p>

      <div className="flex gap-1 mb-3">
        {(["OPEN", "UPHELD", "REJECTED"] as const).map((s) => (
          <a key={s} href={`/Home/Online_Exams/appeals?status=${s}`}
             className={`text-xs px-3 py-1 rounded-full ${status === s ? "bg-brand-700 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
            {s} ({countMap[s] ?? 0})
          </a>
        ))}
      </div>

      <AppealsClient appeals={appeals.map((a) => ({
        id: a.id,
        examTitle: a.exam.title,
        questionText: qMap.get(a.questionId)?.text ?? "(deleted question)",
        questionMarks: qMap.get(a.questionId)?.marks ?? 0,
        studentName: sMap.get(a.studentId)?.user.name ?? "—",
        admissionNo: sMap.get(a.studentId)?.admissionNo ?? "—",
        reason: a.reason,
        status: a.status,
        resolution: a.resolution,
        scoreDelta: a.scoreDelta,
        createdAt: a.createdAt.toISOString(),
        resolvedAt: a.resolvedAt?.toISOString() ?? null,
      }))} />
    </div>
  );
}
