import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fmtDate } from "@/lib/utils";
import { ClipboardList, Plus, Paperclip, MessageSquare } from "lucide-react";

export default async function ClasswokPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = (session!.user as any).role;

  const subjects = await prisma.subject.findMany({
    where: { classId: id },
    include: {
      assignments: { orderBy: { createdAt: "desc" }, include: { _count: { select: { submissions: true } } } },
    },
    orderBy: { name: "asc" },
  });

  const isTeacher = role === "TEACHER" || role === "ADMIN" || role === "PRINCIPAL";

  return (
    <div className="relative">
      {subjects.map((s) => (
        <div key={s.id} className="mb-6">
          <h3 className="text-2xl font-normal text-slate-800 px-1 pb-2 border-b border-slate-200 mb-2">{s.name}</h3>
          {s.assignments.length === 0 ? (
            <div className="text-sm text-slate-500 px-1">No work yet.</div>
          ) : (
            s.assignments.map((a) => (
              <Link key={a.id} href={`/classes/${id}/work/${a.id}`} className="flex items-center gap-3 py-3 px-1 rounded-lg hover:bg-slate-50">
                <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{a.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>Posted {fmtDate(a.createdAt)}</span>
                    {a.dueAt && <span>· Due {fmtDate(a.dueAt)}</span>}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      ))}

      {isTeacher && (
        <Link href={`/classes/${id}/work/new`} className="fab" aria-label="Create work">
          <Plus className="w-6 h-6" />
        </Link>
      )}
    </div>
  );
}
