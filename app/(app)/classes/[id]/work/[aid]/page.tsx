import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fmtDate, initials } from "@/lib/utils";
import { ChevronLeft, Share2, MoreVertical, FileText } from "lucide-react";
import { gradeSubmission } from "@/app/actions/lms";
import StudentTurnIn from "@/components/StudentTurnIn";

export default async function AssignmentPage({ params }: { params: Promise<{ id: string; aid: string }> }) {
  const { id, aid } = await params;
  const session = await auth();
  const user = session!.user as any;
  const role = user.role;

  const a = await prisma.assignment.findUnique({
    where: { id: aid },
    include: {
      class: true, subject: true, teacher: { include: { user: true } },
      submissions: { include: { student: { include: { user: true } } } },
    },
  });
  if (!a) notFound();

  const isTeacherView = role === "TEACHER" || role === "ADMIN" || role === "PRINCIPAL";

  if (!isTeacherView) {
    // Student view: turn-in panel
    const stu = await prisma.student.findUnique({ where: { userId: user.id } });
    const sub = stu ? a.submissions.find((s) => s.studentId === stu.id) : null;

    return (
      <div className="bg-slate-100 -m-6 min-h-[calc(100vh-3.5rem)] pb-32">
        <div className="bg-slate-100 px-6 py-4 flex items-center justify-between">
          <Link href={`/classes/${id}/classwork`} className="p-2 rounded-full hover:bg-slate-200">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <Link href={`/classes/${id}`} className="p-2 rounded-full hover:bg-slate-200" aria-label="Open class">
            <MoreVertical className="w-5 h-5" />
          </Link>
        </div>

        <div className="px-6 bg-white pt-6 pb-8">
          <div className="text-xs text-slate-500">Due {fmtDate(a.dueAt)}</div>
          <h1 className="text-3xl font-medium text-slate-900 mt-1">{a.title}</h1>
          <div className="text-sm text-slate-600 mt-2">{a.maxPoints} points</div>
          <Link
            href={`/classes/${id}/announce?ref=${aid}`}
            className="mt-3 text-brand-700 text-sm flex items-center gap-2 hover:underline"
          >
            <span className="w-5 h-5 rounded-md bg-brand-100 text-brand-700 grid place-items-center">💬</span>
            Post a class announcement about this assignment
          </Link>
          <hr className="my-5" />
          <p className="text-base text-slate-700 whitespace-pre-line">{a.description}</p>
        </div>

        <div className="bg-slate-100 px-6 pt-6">
          <StudentTurnIn
            submissionId={sub?.id ?? ""}
            assignmentId={aid}
            status={sub?.status ?? "ASSIGNED"}
            attachments={parseAttachments(sub?.attachments)}
            dueDate={fmtDate(a.dueAt)}
            feedback={sub?.feedback}
            grade={sub?.grade}
            maxPoints={a.maxPoints}
          />
        </div>
      </div>
    );
  }

  // Teacher view — student work list
  const turnedIn = a.submissions.filter((s) => s.status === "TURNED_IN");
  const graded   = a.submissions.filter((s) => s.status === "GRADED");
  const missing  = a.submissions.filter((s) => s.status === "MISSING");
  const assigned = a.submissions.filter((s) => s.status === "ASSIGNED");

  return (
    <div className="bg-slate-100 -m-6 min-h-[calc(100vh-3.5rem)] pb-12">
      <div className="bg-slate-100 px-6 py-4 flex items-center justify-between">
        <Link href={`/classes/${id}/classwork`} className="p-2 rounded-full hover:bg-slate-200">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="px-4 py-2 rounded-full border border-slate-300 text-brand-700 font-medium text-sm flex items-center gap-2">
          ✏️ {a.maxPoints} points
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/classes/${id}/announce?ref=${aid}`} className="p-2 rounded-full hover:bg-slate-200" aria-label="Share / announce">
            <Share2 className="w-5 h-5" />
          </Link>
          <Link href={`/classes/${id}/work/${aid}/edit`} className="p-2 rounded-full hover:bg-slate-200" aria-label="Edit assignment">
            <MoreVertical className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="px-6">
        <div className="flex border-b border-slate-300">
          <div className="px-4 py-3 text-slate-500">Instructions</div>
          <div className="px-4 py-3 text-brand-700 font-medium border-b-2 border-brand-700 -mb-px">Student work</div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-300 py-5 mb-2">
          <Stat n={a.submissions.length - turnedIn.length - graded.length - missing.length} label="Assigned" />
          <Stat n={turnedIn.length} label="Turned in" />
          <Stat n={graded.length} label="Graded" />
        </div>

        <h3 className="text-base font-medium text-slate-700 mt-6 mb-2">{a.title}</h3>
        <div className="text-sm text-slate-700 mb-6">{a.description}</div>

        <div className="card divide-y divide-slate-100">
          <Section title="TURNED IN" items={turnedIn} aid={aid} maxPoints={a.maxPoints} />
          <Section title="GRADED" items={graded} aid={aid} maxPoints={a.maxPoints} showGrade />
          <Section title="ASSIGNED" items={assigned} aid={aid} maxPoints={a.maxPoints} pending />
          <Section title="MISSING" items={missing} aid={aid} maxPoints={a.maxPoints} missing />
        </div>
      </div>
    </div>
  );
}

function parseAttachments(raw: string | null | undefined): any[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-normal text-slate-900">{n}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function Section({ title, items, aid, maxPoints, showGrade, pending, missing }: any) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50">{title}</div>
      <ul>
        {items.map((s: any) => (
          <li key={s.id} className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-medium">
              {initials(s.student.user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{s.student.user.name}</div>
              <div className="text-xs text-slate-500">Roll {s.student.rollNo}</div>
            </div>
            {showGrade ? (
              <span className="badge-green">Graded · {s.grade}/{maxPoints}</span>
            ) : pending ? (
              <span className="badge-slate">Assigned</span>
            ) : missing ? (
              <span className="badge-red">Missing</span>
            ) : (
              <form action={gradeSubmission.bind(null, s.id, aid)} className="flex items-center gap-2">
                <input
                  className="w-16 input py-1.5 text-center"
                  defaultValue={Math.floor(70 + Math.random() * 25)}
                  name="grade"
                  type="number"
                  min={0}
                  max={maxPoints}
                />
                <button className="btn-primary py-1.5">Grade</button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
