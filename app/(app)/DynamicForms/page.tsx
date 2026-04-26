import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DynamicFormsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const forms = await prisma.dynamicForm.findMany({
    where: { schoolId: sId },
    include: { _count: { select: { submissions: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Dynamic Forms</h1>
          <p className="muted">Build custom forms (text, number, date, dropdown, file, signature, repeating sections).</p>
        </div>
        <button className="btn-primary">+ New form</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {forms.length === 0 && <div className="text-sm text-slate-500 col-span-full">No dynamic forms yet.</div>}
        {forms.map((f) => (
          <div key={f.id} className="card card-pad">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{f.name}</div>
                <div className="text-xs text-slate-500">{f.description ?? "—"}</div>
              </div>
              <span className={f.active ? "badge-green" : "badge-slate"}>{f.active ? "Active" : "Inactive"}</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">
              Audience: {f.audience} · Submissions: {f._count.submissions}
            </div>
            <div className="flex gap-1 mt-3">
              <button className="btn-tonal text-xs px-3 py-1">Open</button>
              <button className="btn-outline text-xs px-3 py-1">Submissions</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
