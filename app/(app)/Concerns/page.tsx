import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function resolve(form: FormData) {
  "use server";
  const id = String(form.get("id"));
  await prisma.concern.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date(), resolution: String(form.get("resolution") ?? "") || null },
  });
  revalidatePath("/Concerns");
}

export default async function ConcernsListPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const where: any = { schoolId: sId };
  if (sp.status) where.status = sp.status;
  const list = await prisma.concern.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
  const counts = await prisma.concern.groupBy({ by: ["status"], where: { schoolId: sId }, _count: true });
  const cMap: Record<string, number> = {};
  ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].forEach((s) => cMap[s] = 0);
  counts.forEach((c) => cMap[c.status] = c._count);

  // MTTR (mean time-to-resolve) — only resolved
  const resolved = list.filter((c) => c.resolvedAt);
  const totalDur = resolved.reduce((s, c) => s + (new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime()), 0);
  const mttrHours = resolved.length > 0 ? Math.round(totalDur / 3600000 / resolved.length) : 0;

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Concerns</h1>
          <p className="muted">Issue / grievance log with category, severity, owner, SLA, escalation.</p>
        </div>
        <Link href="/Concerns/new" className="btn-primary">+ Raise concern</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {Object.entries(cMap).map(([k, v]) => (
          <Link key={k} href={`/Concerns?status=${k}`} className="card card-pad hover:bg-slate-50">
            <div className="text-[11px] text-slate-500">{k.replace("_", " ")}</div>
            <div className="text-2xl font-medium tracking-tight">{v}</div>
          </Link>
        ))}
        <div className="card card-pad"><div className="text-[11px] text-slate-500">MTTR</div><div className="text-2xl font-medium">{mttrHours}h</div></div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Subject</th><th>Category</th><th>Severity</th><th>Raised by</th><th>SLA</th><th>Status</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={8} className="text-center text-slate-500 py-8">No concerns.</td></tr>}
            {list.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.subject}</td>
                <td><span className="badge-slate">{c.category}</span></td>
                <td>
                  <span className={
                    c.severity === "CRITICAL" ? "badge-red"
                      : c.severity === "HIGH" ? "badge-amber"
                      : c.severity === "MEDIUM" ? "badge-blue"
                      : "badge-slate"
                  }>{c.severity}</span>
                </td>
                <td>{c.anonymous ? <span className="text-slate-500 italic">Anonymous</span> : c.raisedByName}</td>
                <td className="text-xs">{c.slaDueAt ? new Date(c.slaDueAt).toLocaleDateString("en-IN") : "—"}</td>
                <td>
                  <span className={
                    c.status === "RESOLVED" ? "badge-green"
                      : c.status === "CLOSED" ? "badge-slate"
                      : c.status === "IN_PROGRESS" ? "badge-blue"
                      : "badge-amber"
                  }>{c.status.replace("_", " ")}</span>
                </td>
                <td className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="text-right">
                  {c.status !== "RESOLVED" && c.status !== "CLOSED" && (
                    <form action={resolve}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="resolution" value="Marked resolved" />
                      <button className="btn-tonal text-xs px-3 py-1">Resolve</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
