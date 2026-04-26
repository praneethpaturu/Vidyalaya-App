import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createExam } from "@/app/actions/exams";

export default async function NewExamPage() {
  const session = await auth();
  const u = session!.user as any;
  const classes = await prisma.class.findMany({ where: { schoolId: u.schoolId }, include: { subjects: true }, orderBy: [{ grade: "asc" }, { section: "asc" }] });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="h-page mb-4">Create exam</h1>
      <form action={createExam} className="card card-pad space-y-3">
        <div>
          <label className="label">Class</label>
          <select className="input" name="classId" required>
            {classes.map((c) => <option key={c.id} value={c.id} data-subjects={c.subjects.length}>{c.name} ({c.subjects.length} subjects)</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Exam name</label>
            <input className="input" name="name" required placeholder="Half-Yearly 2026-27" />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" name="type">
              <option value="UNIT_TEST">Unit Test</option>
              <option value="HALF_YEARLY">Half-Yearly</option>
              <option value="ANNUAL">Annual</option>
              <option value="PRE_BOARD">Pre-Board</option>
              <option value="BOARD">Board</option>
              <option value="INTERNAL">Internal</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Start date</label><input type="date" name="startDate" className="input" required /></div>
          <div><label className="label">End date</label><input type="date" name="endDate" className="input" required /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Max marks per subject</label><input type="number" name="maxPerSubject" className="input" defaultValue={100} /></div>
          <div><label className="label">Pass percentage</label><input type="number" name="passingPct" className="input" defaultValue={35} step="0.1" /></div>
        </div>
        <div>
          <label className="label">Subjects (held with Cmd to select multiple)</label>
          <p className="text-xs text-slate-500 mb-2">Pick the class first to see its subjects, then re-open this page.</p>
          <select className="input min-h-[140px]" name="subjectIds" multiple>
            {classes.flatMap((c) => c.subjects.map((s) => <option key={s.id} value={s.id}>{c.name} · {s.name}</option>))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Link href="/exams" className="btn-outline">Cancel</Link>
          <button className="btn-primary">Create exam</button>
        </div>
      </form>
    </div>
  );
}
