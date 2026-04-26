import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initials } from "@/lib/utils";

export default async function IDCardsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const students = await prisma.student.findMany({
    where: { schoolId: sId }, include: { user: true, class: true }, take: 24, orderBy: { admissionNo: "asc" },
  });

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">ID Cards</h1>
          <p className="muted">Bulk print queue, single print, re-print log, lost-card request.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline">Bulk print</button>
          <button className="btn-primary">+ New batch</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {students.map((s) => (
          <div key={s.id} className="card overflow-hidden">
            <div className="h-2 bg-brand-600" />
            <div className="p-3 flex gap-3">
              <div className="w-14 h-14 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center text-base font-medium shrink-0">
                {initials(s.user.name)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium leading-tight truncate">{s.user.name}</div>
                <div className="text-[10px] text-slate-500">Adm {s.admissionNo}</div>
                <div className="text-[10px] text-slate-500">{s.class?.name ?? "—"} · Roll {s.rollNo}</div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">DOB: {new Date(s.dob).toLocaleDateString("en-IN")}</div>
              </div>
            </div>
            <div className="px-3 pb-3 flex justify-between text-[10px] text-slate-500 border-t pt-2">
              <span>Valid AY 2026-27</span>
              <span>{(session!.user as any).schoolName.slice(0, 22)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
