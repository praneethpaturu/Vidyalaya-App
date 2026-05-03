import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

async function addSku(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "INVENTORY_MANAGER"]);
  const sku = String(form.get("sku") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const price = Math.round(Number(form.get("price") ?? 0) * 100);
  if (!sku || !name) return;
  await prisma.storeItem.create({
    data: {
      schoolId: u.schoolId, sku, name,
      category: String(form.get("category") ?? "OTHER"),
      price,
      qtyOnHand: Number(form.get("qtyOnHand") ?? 0),
    },
  }).catch(() => {});
  revalidatePath("/Store");
  redirect("/Store?added=1");
}

export const dynamic = "force-dynamic";

export default async function StorePage({
  searchParams,
}: { searchParams: Promise<{ added?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "INVENTORY_MANAGER"]);
  const sp = await searchParams;
  const [items, sales] = await Promise.all([
    prisma.storeItem.findMany({ where: { schoolId: u.schoolId }, orderBy: { name: "asc" } }),
    prisma.storeSale.findMany({ where: { schoolId: u.schoolId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-1">School Store</h1>
      <p className="muted mb-3">Uniforms / books / stationery. SKU, price list, sales counter, refund/exchange.</p>
      {sp.added && <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">SKU added.</div>}

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ New SKU</summary>
        <form action={addSku} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end mt-3">
          <div><label className="label">SKU *</label><input required name="sku" className="input" /></div>
          <div className="md:col-span-2"><label className="label">Name *</label><input required name="name" className="input" /></div>
          <div>
            <label className="label">Category</label>
            <select name="category" className="input" defaultValue="OTHER">
              <option>UNIFORM</option><option>BOOK</option><option>STATIONERY</option><option>OTHER</option>
            </select>
          </div>
          <div><label className="label">Price (₹)</label><input type="number" min={0} step={0.01} name="price" className="input" /></div>
          <div className="md:col-span-2"><label className="label">Opening qty</label><input type="number" min={0} name="qtyOnHand" defaultValue={0} className="input" /></div>
          <button type="submit" className="btn-primary md:col-span-5">Add SKU</button>
        </form>
      </details>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card overflow-x-auto">
          <div className="px-4 py-3 border-b text-sm font-medium">Catalogue</div>
          <table className="table">
            <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th></tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">No items.</td></tr>}
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="font-mono text-xs">{i.sku}</td>
                  <td className="font-medium">{i.name}</td>
                  <td><span className="badge-slate">{i.category}</span></td>
                  <td>{inr(i.price)}</td>
                  <td className={i.qtyOnHand <= 0 ? "text-rose-600" : ""}>{i.qtyOnHand}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card overflow-x-auto">
          <div className="px-4 py-3 border-b text-sm font-medium">Recent sales</div>
          <table className="table">
            <thead><tr><th>Receipt</th><th>Total</th><th>Method</th><th>When</th></tr></thead>
            <tbody>
              {sales.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-8">No sales yet.</td></tr>}
              {sales.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.receiptNo}</td>
                  <td>{inr(s.total)}</td>
                  <td><span className="badge-blue">{s.paymentMethod}</span></td>
                  <td className="text-xs">{new Date(s.createdAt).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
