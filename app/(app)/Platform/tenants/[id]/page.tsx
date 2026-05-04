import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function updateTenant(form: FormData) {
  "use server";
  await requirePageRole(["PLATFORM_ADMIN"]);
  const id = String(form.get("id"));
  await prisma.school.update({
    where: { id },
    data: {
      planKey: String(form.get("planKey") ?? "FREE"),
      planExpiresAt: form.get("planExpiresAt") ? new Date(String(form.get("planExpiresAt"))) : null,
      brandPrimary: String(form.get("brandPrimary") ?? "") || null,
      brandTagline: String(form.get("brandTagline") ?? "") || null,
      customDomain: String(form.get("customDomain") ?? "") || null,
      watermarkAll: form.get("watermarkAll") === "on",
    },
  });
  revalidatePath(`/Platform/tenants/${id}`);
  revalidatePath("/Platform");
}

export default async function TenantPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageRole(["PLATFORM_ADMIN"]);
  const { id } = await params;
  const [school, plans, students, staff, attempts] = await Promise.all([
    prisma.school.findUnique({ where: { id } }),
    prisma.subscriptionPlan.findMany({ orderBy: { pricePerMonth: "asc" } }),
    prisma.student.count({ where: { schoolId: id } }),
    prisma.staff.count({ where: { schoolId: id } }),
    prisma.onlineExamAttempt.count({ where: { exam: { schoolId: id } } }),
  ]);
  if (!school) notFound();

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <a href="/Platform" className="text-xs text-brand-700 hover:underline">← Platform</a>
      <h1 className="h-page mt-1 mb-1">{school.name}</h1>
      <p className="muted mb-4">{school.code} · {school.city}, {school.state}</p>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <Stat label="Students" value={students} />
        <Stat label="Staff" value={staff} />
        <Stat label="Lifetime attempts" value={attempts} />
      </div>

      <form action={updateTenant} className="card card-pad space-y-3">
        <input type="hidden" name="id" value={school.id} />
        <div>
          <label className="label">Subscription plan</label>
          <select name="planKey" defaultValue={school.planKey} className="input">
            {plans.map((p) => <option key={p.key} value={p.key}>{p.name} ({p.key}) — ₹{(p.pricePerMonth / 100).toLocaleString("en-IN")}/mo</option>)}
          </select>
        </div>
        <div>
          <label className="label">Plan expires (optional)</label>
          <input type="date" name="planExpiresAt" defaultValue={school.planExpiresAt ? school.planExpiresAt.toISOString().slice(0, 10) : ""} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Brand primary (hex)</label>
            <input name="brandPrimary" defaultValue={school.brandPrimary ?? ""} className="input" placeholder="#1a73e8" />
          </div>
          <div>
            <label className="label">Custom domain</label>
            <input name="customDomain" defaultValue={school.customDomain ?? ""} className="input" placeholder="exams.school.edu.in" />
          </div>
        </div>
        <div>
          <label className="label">Brand tagline</label>
          <input name="brandTagline" defaultValue={school.brandTagline ?? ""} className="input" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="watermarkAll" defaultChecked={school.watermarkAll} /> Watermark all PDFs and exam content
        </label>
        <div className="flex justify-end">
          <button className="btn-primary">Save changes</button>
        </div>
      </form>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card card-pad">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-medium tracking-tight">{value.toLocaleString("en-IN")}</div>
    </div>
  );
}
