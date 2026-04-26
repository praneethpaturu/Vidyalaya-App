// Stream tab — announcements + recent assignments feed
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fmtDate } from "@/lib/utils";
import { Pencil, Repeat2, ClipboardList, Megaphone } from "lucide-react";

export default async function ClassStreamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = (session!.user as any).role;

  const [assignments, anns] = await Promise.all([
    prisma.assignment.findMany({
      where: { classId: id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        teacher: { include: { user: true } },
        subject: true,
        _count: { select: { submissions: true } },
        submissions: true,
      },
    }),
    prisma.announcement.findMany({
      where: { classId: id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const isTeacherView = role === "TEACHER" || role === "ADMIN" || role === "PRINCIPAL";

  return (
    <div className="space-y-3">
      {isTeacherView && (
        <div className="flex flex-wrap gap-2 mb-2">
          <Link href={`/classes/${id}/announce`} className="btn-tonal">
            <Pencil className="w-4 h-4" /> New announcement
          </Link>
          <button className="btn-outline">
            <Repeat2 className="w-4 h-4" /> Repost
          </button>
        </div>
      )}

      {anns.map((a) => (
        <div key={a.id} className="card p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{a.title}</div>
            <div className="text-xs text-slate-500 mt-0.5">Posted {fmtDate(a.createdAt)}</div>
            <p className="text-sm text-slate-700 mt-2 whitespace-pre-line">{a.body}</p>
          </div>
        </div>
      ))}

      {assignments.map((a) => {
        const turnedIn = a.submissions.filter((s) => s.status === "TURNED_IN").length;
        const graded = a.submissions.filter((s) => s.status === "GRADED").length;
        const assigned = a.submissions.filter((s) => s.status === "ASSIGNED").length;
        return (
          <Link href={`/classes/${id}/work/${a.id}`} key={a.id} className="card block hover:shadow-cardHover transition">
            <div className="p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {a.teacher.user.name} · Posted {fmtDate(a.createdAt)} · Due {fmtDate(a.dueAt)}
                </div>
              </div>
            </div>
            {isTeacherView && (
              <div className="border-t border-slate-100 stat-triplet">
                <div>
                  <div className="stat-num">{turnedIn}</div>
                  <div className="stat-label">Turned in</div>
                </div>
                <div>
                  <div className="stat-num">{assigned}</div>
                  <div className="stat-label">Assigned</div>
                </div>
                <div>
                  <div className="stat-num">{graded}</div>
                  <div className="stat-label">Graded</div>
                </div>
              </div>
            )}
            <div className="px-4 pb-4 text-sm text-slate-700 line-clamp-2">{a.description}</div>
          </Link>
        );
      })}

      {assignments.length === 0 && anns.length === 0 && (
        <div className="card card-pad text-center text-slate-500">No posts yet.</div>
      )}
    </div>
  );
}
