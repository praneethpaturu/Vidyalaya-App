import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function recordActivity(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const staffId = String(form.get("staffId"));
  const title = String(form.get("title") ?? "").trim();
  const completedAt = String(form.get("completedAt") ?? "");
  if (!staffId || !title || !completedAt) return;
  await prisma.cPDActivity.create({
    data: {
      schoolId: u.schoolId, staffId, title,
      type: String(form.get("type") ?? "WORKSHOP"),
      hours: Number(form.get("hours") ?? 0),
      completedAt: new Date(completedAt),
      certificateUrl: String(form.get("certificateUrl") ?? "") || null,
      notes: String(form.get("notes") ?? "") || null,
      recordedById: u.id,
    },
  });
  revalidatePath("/AddOns/CPD");
  redirect("/AddOns/CPD?added=1");
}

export const dynamic = "force-dynamic";

export default async function CPDPage({
  searchParams,
}: { searchParams: Promise<{ added?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const sp = await searchParams;
  const today = new Date();
  const fyStart = today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear();
  const yearStart = new Date(fyStart, 3, 1);
  const yearEnd = new Date(fyStart + 1, 2, 31, 23, 59, 59);

  const [staff, activities] = await Promise.all([
    prisma.staff.findMany({
      where: { schoolId: u.schoolId, deletedAt: null as any },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.cPDActivity.findMany({
      where: { schoolId: u.schoolId, completedAt: { gte: yearStart, lte: yearEnd } },
      orderBy: { completedAt: "desc" },
    }),
  ]);
  const staffMap = new Map(staff.map((s) => [s.id, s]));
  const hoursByStaff: Record<string, number> = {};
  for (const a of activities) hoursByStaff[a.staffId] = (hoursByStaff[a.staffId] ?? 0) + a.hours;

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Continuous Professional Development</h1>
      <p className="muted mb-4">FY {fyStart}-{String((fyStart + 1) % 100).padStart(2, "0")} · per-staff hour ledger.</p>
      {sp.added && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Activity recorded.</div>}

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ Record activity</summary>
        <form action={recordActivity} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <div>
            <label className="label">Staff *</label>
            <select required name="staffId" className="input" defaultValue="">
              <option value="">— Select —</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.user.name} · {s.designation}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Title *</label>
            <input required name="title" className="input" placeholder="CBSE National Conference on Pedagogy" />
          </div>
          <div>
            <label className="label">Type</label>
            <select name="type" className="input" defaultValue="WORKSHOP">
              <option>WORKSHOP</option><option>CONFERENCE</option><option>COURSE</option>
              <option>OBSERVATION</option><option>WEBINAR</option>
            </select>
          </div>
          <div>
            <label className="label">Hours</label>
            <input type="number" min={0} step={0.5} name="hours" defaultValue={2} className="input" />
          </div>
          <div>
            <label className="label">Completed on *</label>
            <input required type="date" name="completedAt" className="input" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div className="md:col-span-3">
            <label className="label">Certificate URL</label>
            <input name="certificateUrl" className="input" placeholder="https://..." />
          </div>
          <div className="md:col-span-3">
            <label className="label">Notes</label>
            <input name="notes" className="input" />
          </div>
          <button type="submit" className="btn-primary md:col-span-3">Record</button>
        </form>
      </details>

      <h2 className="h-section mb-2">Per-staff CPD-hour ledger</h2>
      <div className="card overflow-x-auto mb-5">
        <table className="table">
          <thead><tr><th>Staff</th><th>Designation</th><th className="text-right">Hours</th><th>Status</th></tr></thead>
          <tbody>
            {staff.map((s) => {
              const h = hoursByStaff[s.id] ?? 0;
              return (
                <tr key={s.id}>
                  <td>{s.user.name}</td>
                  <td className="text-xs">{s.designation}</td>
                  <td className="text-right tabular-nums">{h.toFixed(1)}</td>
                  <td>
                    <span className={h >= 30 ? "badge-green" : h >= 15 ? "badge-amber" : "badge-red"}>
                      {h >= 30 ? "On track" : h >= 15 ? "Mid-year" : "Below target"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="h-section mb-2">Recent activities</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Date</th><th>Staff</th><th>Title</th><th>Type</th><th className="text-right">Hours</th><th></th></tr></thead>
          <tbody>
            {activities.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No activities recorded for this FY.</td></tr>}
            {activities.map((a) => (
              <tr key={a.id}>
                <td className="text-xs">{new Date(a.completedAt).toLocaleDateString("en-IN")}</td>
                <td>{staffMap.get(a.staffId)?.user.name ?? "—"}</td>
                <td>{a.title}</td>
                <td><span className="badge-blue text-xs">{a.type}</span></td>
                <td className="text-right tabular-nums">{a.hours.toFixed(1)}</td>
                <td>{a.certificateUrl && <a target="_blank" href={a.certificateUrl} className="text-brand-700 text-xs hover:underline">Cert</a>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
