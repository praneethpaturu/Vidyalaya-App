import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function setGoal(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const staffId = String(form.get("staffId"));
  const fy = String(form.get("fy") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  if (!staffId || !fy || !title) return;
  await prisma.staffGoal.create({
    data: {
      schoolId: u.schoolId, staffId, fy, title,
      description: String(form.get("description") ?? "") || null,
      kpi: String(form.get("kpi") ?? "") || null,
      weight: Number(form.get("weight") ?? 20),
      status: "ACTIVE",
    },
  });
  revalidatePath("/AddOns/PMS");
  redirect("/AddOns/PMS?added=1");
}

async function recordReview(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const goalId = String(form.get("goalId"));
  await prisma.staffReview.upsert({
    where: { goalId_period: { goalId, period: String(form.get("period") ?? "MID") } },
    update: {
      rating: form.get("rating") ? Number(form.get("rating")) : null,
      comments: String(form.get("comments") ?? "") || null,
      reviewedById: u.id,
      reviewedAt: new Date(),
    },
    create: {
      goalId, period: String(form.get("period") ?? "MID"),
      rating: form.get("rating") ? Number(form.get("rating")) : null,
      comments: String(form.get("comments") ?? "") || null,
      reviewedById: u.id,
    },
  });
  revalidatePath("/AddOns/PMS");
}

async function setGoalStatus(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const id = String(form.get("id"));
  const status = String(form.get("status"));
  await prisma.staffGoal.updateMany({
    where: { id, schoolId: u.schoolId },
    data: { status },
  });
  revalidatePath("/AddOns/PMS");
}

export const dynamic = "force-dynamic";

export default async function PMSPage({
  searchParams,
}: { searchParams: Promise<{ added?: string; staffId?: string; fy?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const sp = await searchParams;
  const today = new Date();
  const fyDefault = today.getMonth() < 3
    ? `${today.getFullYear() - 1}-${String(today.getFullYear()).slice(-2)}`
    : `${today.getFullYear()}-${String(today.getFullYear() + 1).slice(-2)}`;
  const fy = sp.fy ?? fyDefault;

  const staff = await prisma.staff.findMany({
    where: { schoolId: u.schoolId, deletedAt: null as any },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });
  const activeStaffId = sp.staffId ?? staff[0]?.id;
  const goals = activeStaffId
    ? await prisma.staffGoal.findMany({
        where: { schoolId: u.schoolId, staffId: activeStaffId, fy },
        include: { reviews: true },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const totalWeight = goals.reduce((s, g) => s + g.weight, 0);

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Performance Management</h1>
      <p className="muted mb-3">FY {fy} · staff goals + mid-year & annual reviews.</p>
      {sp.added && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Goal saved.</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">Staff</div>
          <ul className="divide-y divide-slate-100 text-sm max-h-[600px] overflow-y-auto">
            {staff.map((s) => (
              <li key={s.id} className={`px-3 py-2 ${s.id === activeStaffId ? "bg-brand-50" : ""}`}>
                <Link href={`/AddOns/PMS?staffId=${s.id}&fy=${fy}`}>
                  <div className="font-medium">{s.user.name}</div>
                  <div className="text-xs text-slate-500">{s.designation}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {activeStaffId && (
            <details className="card card-pad">
              <summary className="cursor-pointer font-medium">+ Add a goal for {staff.find((s) => s.id === activeStaffId)?.user.name}</summary>
              <form action={setGoal} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
                <input type="hidden" name="staffId" value={activeStaffId} />
                <input type="hidden" name="fy" value={fy} />
                <div className="md:col-span-2"><label className="label">Title *</label><input required name="title" className="input" placeholder="Improve Class 8 Math board pass rate to 95%" /></div>
                <div><label className="label">Weight %</label><input type="number" min={1} max={100} name="weight" defaultValue={20} className="input" /></div>
                <div className="md:col-span-3"><label className="label">Description</label><textarea name="description" rows={2} className="input" /></div>
                <div className="md:col-span-3"><label className="label">KPI</label><input name="kpi" className="input" placeholder="≥ 95% pass · class average ≥ 70" /></div>
                <button type="submit" className="btn-primary md:col-span-3">Save goal</button>
              </form>
            </details>
          )}

          {goals.length === 0 ? (
            <div className="card card-pad text-center text-sm text-slate-500">No goals for this staff in {fy}.</div>
          ) : (
            <>
              <div className="text-xs text-slate-500">Total weight allocated: <span className={totalWeight === 100 ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>{totalWeight}%</span></div>
              {goals.map((g) => {
                const mid = g.reviews.find((r) => r.period === "MID");
                const ann = g.reviews.find((r) => r.period === "ANNUAL");
                return (
                  <div key={g.id} className="card card-pad">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{g.title} <span className="text-xs text-slate-500">· {g.weight}%</span></div>
                        {g.description && <div className="text-sm text-slate-600 mt-1">{g.description}</div>}
                        {g.kpi && <div className="text-xs text-slate-500 mt-1">KPI: {g.kpi}</div>}
                      </div>
                      <span className={
                        g.status === "MET" ? "badge-green" :
                        g.status === "MISSED" ? "badge-red" :
                        g.status === "DRAFT" ? "badge-slate" : "badge-blue"
                      }>{g.status}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      {(["MID", "ANNUAL"] as const).map((period) => {
                        const r = period === "MID" ? mid : ann;
                        return (
                          <details key={period} className="border border-slate-200 rounded-lg p-3">
                            <summary className="text-sm font-medium cursor-pointer">
                              {period === "MID" ? "Mid-year review" : "Annual review"}
                              {r?.rating != null && <span className="ml-2 text-xs text-slate-500">· {r.rating}/5</span>}
                            </summary>
                            <form action={recordReview} className="space-y-2 mt-2">
                              <input type="hidden" name="goalId" value={g.id} />
                              <input type="hidden" name="period" value={period} />
                              <select name="rating" defaultValue={r?.rating ?? ""} className="input text-sm">
                                <option value="">— Rating —</option>
                                <option value="1">1 — Below expectations</option>
                                <option value="2">2 — Partially met</option>
                                <option value="3">3 — Met</option>
                                <option value="4">4 — Exceeded</option>
                                <option value="5">5 — Outstanding</option>
                              </select>
                              <textarea name="comments" defaultValue={r?.comments ?? ""} rows={2} className="input text-sm" placeholder="Comments" />
                              <button type="submit" className="btn-tonal text-xs">Save review</button>
                            </form>
                          </details>
                        );
                      })}
                    </div>

                    <div className="flex gap-1 mt-3 justify-end">
                      {(["ACTIVE", "MET", "MISSED"] as const).map((s) => (
                        <form key={s} action={setGoalStatus} className="inline">
                          <input type="hidden" name="id" value={g.id} />
                          <input type="hidden" name="status" value={s} />
                          <button className={`text-xs px-2 py-1 rounded ${g.status === s ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
                            {s}
                          </button>
                        </form>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
