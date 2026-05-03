import { revalidatePath } from "next/cache";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function addCategory(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "INVENTORY_MANAGER"]);
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  await prisma.storeCategory.create({
    data: {
      schoolId: u.schoolId,
      name,
      parentId: (String(form.get("parentId") ?? "") || null) as any,
    },
  }).catch(() => {});
  revalidatePath("/Settings/store-categories");
}

async function toggleCategory(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "INVENTORY_MANAGER"]);
  const id = String(form.get("id"));
  const cur = await prisma.storeCategory.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!cur) return;
  await prisma.storeCategory.update({ where: { id }, data: { active: !cur.active } });
  revalidatePath("/Settings/store-categories");
}

export const dynamic = "force-dynamic";

export default async function StoreCategoriesPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "INVENTORY_MANAGER"]);
  const rows = await prisma.storeCategory.findMany({
    where: { schoolId: u.schoolId },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });
  const byParent = new Map<string | null, typeof rows>();
  for (const r of rows) {
    const k = r.parentId ?? null;
    const arr = byParent.get(k) ?? [];
    arr.push(r);
    byParent.set(k, arr);
  }
  const top = byParent.get(null) ?? [];

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-1">Store categories</h1>
      <p className="muted mb-5">
        Two-level hierarchy for inventory + store items: top-level Category → Subcategory.
        Categories drive the Inventory + Store filter dropdowns and reorder reports.
      </p>

      <section className="card card-pad mb-5">
        <form action={addCategory} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2"><label className="label">Name *</label><input className="input" name="name" placeholder="Stationery" required /></div>
          <div>
            <label className="label">Parent (sub-category)</label>
            <select className="input" name="parentId" defaultValue="">
              <option value="">— Top level —</option>
              {top.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary md:col-span-3">Add category</button>
        </form>
      </section>

      <section className="card">
        <ul className="divide-y divide-slate-100">
          {top.length === 0 && <li className="px-4 py-6 text-sm text-slate-500 text-center">No categories yet.</li>}
          {top.map((cat) => (
            <li key={cat.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className={`font-medium ${cat.active ? "" : "text-slate-400 line-through"}`}>{cat.name}</div>
                <form action={toggleCategory}>
                  <input type="hidden" name="id" value={cat.id} />
                  <button className="text-xs text-brand-700 hover:underline" type="submit">{cat.active ? "Disable" : "Enable"}</button>
                </form>
              </div>
              {byParent.get(cat.id)?.length ? (
                <ul className="ml-6 mt-2 space-y-1 text-sm">
                  {byParent.get(cat.id)!.map((sub) => (
                    <li key={sub.id} className="flex items-center justify-between">
                      <span className={sub.active ? "" : "text-slate-400 line-through"}>· {sub.name}</span>
                      <form action={toggleCategory}>
                        <input type="hidden" name="id" value={sub.id} />
                        <button className="text-xs text-slate-500 hover:underline" type="submit">{sub.active ? "Disable" : "Enable"}</button>
                      </form>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
