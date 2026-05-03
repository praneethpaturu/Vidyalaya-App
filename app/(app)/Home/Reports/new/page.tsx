import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PRESETS } from "@/lib/reports/runner";

async function createTemplate(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER"]);
  const name = String(form.get("name") ?? "").trim();
  const preset = String(form.get("preset") ?? "");
  const category = String(form.get("category") ?? "FINANCE");
  if (!name || !preset) return;
  const tpl = await prisma.reportTemplate.create({
    data: {
      schoolId: u.schoolId,
      name,
      category,
      query: JSON.stringify({ preset, name }),
      createdById: u.id,
    },
  });
  revalidatePath("/Home/Reports");
  redirect(`/Home/Reports/custom/${tpl.id}`);
}

export const dynamic = "force-dynamic";

export default async function NewReportPage() {
  await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER"]);
  return (
    <div className="p-5 max-w-2xl mx-auto">
      <Link href="/Home/Reports" className="text-xs text-brand-700 hover:underline">← Back to Reports</Link>
      <h1 className="h-page mt-1 mb-1">Build custom report</h1>
      <p className="muted mb-4">
        Pick the data set; we'll save it as a reusable template you can run anytime from the Reports home.
      </p>
      <form action={createTemplate} className="card card-pad space-y-3">
        <div>
          <label className="label">Template name *</label>
          <input required name="name" className="input" placeholder="Daily fee — Bangalore branch" />
        </div>
        <div>
          <label className="label">Data set *</label>
          <select required name="preset" className="input" defaultValue="">
            <option value="">— Pick a data set —</option>
            {PRESETS.map((p) => (
              <option key={p.key} value={p.key}>{p.name} · {p.category}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select name="category" className="input" defaultValue="FINANCE">
            <option>FINANCE</option><option>SIS</option><option>HR</option>
            <option>TRANSPORT</option><option>LIBRARY</option><option>HOSTEL</option>
            <option>LMS</option><option>CONNECT</option><option>ADMISSIONS</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Link href="/Home/Reports" className="btn-outline">Cancel</Link>
          <button type="submit" className="btn-primary">Save template</button>
        </div>
      </form>
    </div>
  );
}
