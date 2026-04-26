import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";
import Link from "next/link";
import { llm, logAi } from "@/lib/ai";

export default async function HPCNarrativePage({
  searchParams,
}: { searchParams: Promise<{ id?: string }> }) {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;
  const userId = (session!.user as any).id as string;
  const { id } = await searchParams;

  const students = await prisma.student.findMany({
    where: { schoolId: sId },
    include: { user: true, class: true },
    take: 60,
  });
  const selected = id ? students.find((s) => s.id === id) : students[0];

  let draft = "";
  if (selected) {
    const [marks, attendance, hpc] = await Promise.all([
      prisma.examMark.findMany({ where: { studentId: selected.id }, select: { marksObtained: true } }),
      prisma.classAttendance.count({ where: { studentId: selected.id, status: "PRESENT" } }),
      (prisma as any).nEPHPCEntry?.findMany?.({ where: { studentId: selected.id } }) ?? [],
    ]);
    const avg = marks.length ? marks.reduce((a, b) => a + b.marksObtained, 0) / marks.length : 0;
    const ctx = [
      `Student: ${selected.user.name} (${selected.class?.name ?? "—"})`,
      `Average mark across exams: ${avg.toFixed(1)}`,
      `Days marked present: ${attendance}`,
      `Recent HPC entries: ${(hpc as any[]).length}`,
    ].join("\n");
    const result = await llm(
      [{ role: "user", content: `Draft a 4-paragraph NEP-HPC style narrative for this learner. End with one specific growth goal.\n\n${ctx}` }],
      { task: "narrative", system: "You write NEP HPC narratives. Strengths-based. No grades or numerical scores in the narrative.", maxTokens: 600 },
    );
    draft = result.text;
    await logAi({ schoolId: sId, userId, feature: "hpc-narrative", result });
  }

  return (
    <AIPageShell
      title="HPC Narrative Drafts"
      subtitle="Strengths-based NEP HPC narrative drafts. Always reviewed by the teacher before publication."
      needsLLM
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card card-pad lg:col-span-1 max-h-[70vh] overflow-y-auto">
          <div className="text-xs font-medium text-slate-500 mb-2">Students</div>
          <ul className="space-y-1">
            {students.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/Home/AI/hpc-narrative?id=${s.id}`}
                  className={`block px-2 py-1.5 rounded-md text-sm hover:bg-slate-50 ${
                    selected?.id === s.id ? "bg-brand-50 text-brand-700" : "text-slate-700"
                  }`}
                >
                  <div className="font-medium truncate">{s.user.name}</div>
                  <div className="text-[11px] text-slate-500">{s.class?.name ?? "—"} · {s.admissionNo}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="card card-pad lg:col-span-2">
          {selected ? (
            <>
              <div className="text-xs text-slate-500">Draft for {selected.user.name}</div>
              <div className="text-[11px] text-slate-400 mb-2">Status: PENDING — reviewer must accept before this is published.</div>
              <pre className="whitespace-pre-wrap text-sm bg-slate-50 rounded-md p-3 border border-slate-200">{draft}</pre>
            </>
          ) : (
            <div className="text-sm text-slate-500">Select a student.</div>
          )}
        </div>
      </div>
    </AIPageShell>
  );
}
