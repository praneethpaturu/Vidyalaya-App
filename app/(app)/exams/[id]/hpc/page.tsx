import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import HpcClient from "./HpcClient";

export const dynamic = "force-dynamic";

export default async function HpcPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const { id } = await params;
  const exam = await prisma.exam.findFirst({
    where: { id, schoolId: u.schoolId },
    include: { class: { include: { students: { include: { user: true }, orderBy: { rollNo: "asc" } } } } },
  });
  if (!exam) notFound();

  const term = exam.type?.match(/^T[1-3]$/i) ? exam.type.toUpperCase() : "T1";
  const year = exam.startDate.getFullYear();

  const entries = await prisma.nEPHPCEntry.findMany({
    where: { schoolId: u.schoolId, term, year, studentId: { in: exam.class.students.map((s) => s.id) } },
    orderBy: { createdAt: "desc" },
  });
  const byStudent: Record<string, typeof entries> = {};
  for (const e of entries) {
    byStudent[e.studentId] = byStudent[e.studentId] ?? [];
    byStudent[e.studentId].push(e);
  }

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <Link href={`/exams/${exam.id}`} className="text-xs text-brand-700 hover:underline">← Back to exam</Link>
      <div className="mt-1 mb-3 flex items-end justify-between">
        <div>
          <h1 className="h-page">NEP-HPC narratives</h1>
          <p className="muted">{exam.name} · {exam.class.name} · term {term} · year {year}</p>
        </div>
        <HpcClient examId={exam.id} studentCount={exam.class.students.length} />
      </div>

      <div className="space-y-3">
        {exam.class.students.map((s) => {
          const e = byStudent[s.id] ?? [];
          const overall = e.find((x) => x.domain === "OVERALL");
          return (
            <details key={s.id} className="card card-pad">
              <summary className="cursor-pointer flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.user.name}</div>
                  <div className="text-xs text-slate-500">{s.admissionNo} · Roll {s.rollNo}</div>
                </div>
                <div>
                  {overall ? (
                    <span className={
                      overall.rubricLevel === "STREAM" ? "badge-green" :
                      overall.rubricLevel === "DEVELOPING" ? "badge-amber" :
                      overall.rubricLevel === "EMERGING" ? "badge-red" : "badge-blue"
                    }>{overall.rubricLevel}</span>
                  ) : <span className="text-xs text-slate-400">No HPC yet</span>}
                </div>
              </summary>
              {e.length === 0 ? (
                <div className="text-sm text-slate-500 mt-2">Click "Generate HPC narratives" to create.</div>
              ) : (
                <div className="mt-3 space-y-2">
                  {overall && (
                    <p className="text-sm whitespace-pre-wrap text-slate-700 italic">{overall.descriptor}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                    {e.filter((x) => x.domain !== "OVERALL").map((x) => (
                      <div key={x.id} className="border border-slate-200 rounded-lg p-3">
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-brand-700">{x.domain.replace("_", " ")}</div>
                        <div className="text-sm text-slate-700 mt-1">{x.descriptor}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </details>
          );
        })}
      </div>
    </div>
  );
}
