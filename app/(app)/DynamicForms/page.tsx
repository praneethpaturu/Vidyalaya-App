import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function addForm(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  await prisma.dynamicForm.create({
    data: {
      schoolId: u.schoolId, name,
      description: String(form.get("description") ?? "") || null,
      audience: String(form.get("audience") ?? "ALL"),
      schema: "[]",
      active: true,
    },
  });
  revalidatePath("/DynamicForms");
  redirect("/DynamicForms?added=1");
}

export const dynamic = "force-dynamic";

export default async function DynamicFormsPage({
  searchParams,
}: { searchParams: Promise<{ added?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sp = await searchParams;
  const forms = await prisma.dynamicForm.findMany({
    where: { schoolId: u.schoolId },
    include: { _count: { select: { submissions: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-1">Dynamic Forms</h1>
      <p className="muted mb-3">Build custom forms (text, number, date, dropdown, file, signature, repeating sections).</p>
      {sp.added && <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Form created — add fields next.</div>}

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ New form</summary>
        <form action={addForm} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <div className="md:col-span-2">
            <label className="label">Name *</label>
            <input required name="name" className="input" placeholder="Annual Health Form" />
          </div>
          <div>
            <label className="label">Audience</label>
            <select name="audience" className="input" defaultValue="ALL">
              <option>ALL</option><option>STAFF</option><option>STUDENTS</option><option>PARENTS</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="label">Description</label>
            <textarea name="description" className="input" rows={2} />
          </div>
          <button type="submit" className="btn-primary md:col-span-3">Create form</button>
        </form>
      </details>

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
          </div>
        ))}
      </div>
    </div>
  );
}
