import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

async function addScheme(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  await prisma.scholarship.create({
    data: {
      schoolId: u.schoolId,
      name,
      description: String(form.get("description") ?? "") || null,
      amount: Math.round(Number(form.get("amount") ?? 0) * 100),
      eligibility: String(form.get("eligibility") ?? "") || null,
      active: true,
    },
  });
  revalidatePath("/Home/Finance/scholarship");
  redirect("/Home/Finance/scholarship?added=1");
}

async function deactivate(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const id = String(form.get("id"));
  await prisma.scholarship.updateMany({
    where: { id, schoolId: u.schoolId },
    data: { active: false },
  });
  revalidatePath("/Home/Finance/scholarship");
}

export const dynamic = "force-dynamic";

export default async function ScholarshipPage({
  searchParams,
}: { searchParams: Promise<{ added?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const sp = await searchParams;
  const [scholarships, awards] = await Promise.all([
    prisma.scholarship.findMany({ where: { schoolId: u.schoolId, active: true } }),
    prisma.scholarshipAward.findMany({ take: 50, orderBy: { awardedOn: "desc" }, include: { scholarship: true } }),
  ]);

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Scholarship</h1>

      {sp.added && (
        <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">
          New scheme added.
        </div>
      )}

      <section className="card card-pad mb-6">
        <h2 className="h-section mb-3">Add a new scheme</h2>
        <form action={addScheme} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="label">Name *</label>
            <input required className="input" name="name" placeholder="Merit Scholarship 2026-27" />
          </div>
          <div>
            <label className="label">Amount (₹)</label>
            <input className="input" name="amount" type="number" min={0} step={1} placeholder="50000" />
          </div>
          <div>
            <label className="label">Eligibility</label>
            <input className="input" name="eligibility" placeholder="Top 5% of class X" />
          </div>
          <div className="md:col-span-4">
            <label className="label">Description</label>
            <textarea className="input" name="description" rows={2} />
          </div>
          <button type="submit" className="btn-primary md:col-span-4">Add scheme</button>
        </form>
      </section>

      <h2 className="h-section mb-2">Active schemes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {scholarships.length === 0 && <div className="text-sm text-slate-500">No active schemes.</div>}
        {scholarships.map((s) => (
          <div key={s.id} className="card card-pad">
            <div className="text-base font-medium">{s.name}</div>
            <div className="muted text-sm">{s.description ?? "—"}</div>
            <div className="text-xl font-medium mt-2">{inr(s.amount)}</div>
            <div className="text-xs text-slate-500 mt-1">Eligibility: {s.eligibility ?? "—"}</div>
            <form action={deactivate} className="mt-2">
              <input type="hidden" name="id" value={s.id} />
              <button type="submit" className="text-xs text-rose-700 hover:underline">Deactivate</button>
            </form>
          </div>
        ))}
      </div>

      <h2 className="h-section mb-2">Recent awards</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Scheme</th><th>Student</th><th className="text-right">Amount</th><th>Awarded</th><th>Status</th></tr></thead>
          <tbody>
            {awards.length === 0 && (
              <tr><td colSpan={5} className="text-center text-slate-500 py-8">No awards yet.</td></tr>
            )}
            {awards.map((a) => (
              <tr key={a.id}>
                <td>{a.scholarship.name}</td>
                <td className="font-mono text-xs">{a.studentId}</td>
                <td className="text-right">{inr(a.amount)}</td>
                <td className="text-xs">{new Date(a.awardedOn).toLocaleDateString("en-IN")}</td>
                <td>
                  <span className={
                    a.status === "DISBURSED" ? "badge-green"
                      : a.status === "REVOKED" ? "badge-red"
                      : a.status === "PENDING" ? "badge-amber"
                      : "badge-blue"
                  }>{a.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
