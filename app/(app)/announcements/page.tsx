import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fmtDateTime, initials } from "@/lib/utils";
import { Pin, Megaphone } from "lucide-react";

export default async function AnnouncementsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const list = await prisma.announcement.findMany({
    where: { schoolId: sId },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { author: true, class: true },
  });
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="h-page mb-1">Announcements</h1>
      <p className="muted mb-6">{list.length} posts</p>
      <div className="space-y-3">
        {list.map((a) => (
          <article key={a.id} className="card card-pad">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center"><Megaphone className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-medium">{a.title}</h2>
                  {a.pinned && <Pin className="w-3.5 h-3.5 text-amber-600" />}
                  <span className="badge-slate ml-auto">{a.audience}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{a.author.name} · {fmtDateTime(a.createdAt)}{a.class ? ` · ${a.class.name}` : ""}</div>
                <p className="mt-3 text-sm text-slate-700 whitespace-pre-line">{a.body}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
