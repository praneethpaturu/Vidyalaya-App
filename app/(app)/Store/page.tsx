import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

export default async function StorePage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const [items, sales] = await Promise.all([
    prisma.storeItem.findMany({ where: { schoolId: sId }, orderBy: { name: "asc" } }),
    prisma.storeSale.findMany({ where: { schoolId: sId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">School Store</h1>
          <p className="muted">Uniforms / books / stationery. SKU, price list, sales counter, refund/exchange.</p>
        </div>
        <button className="btn-primary">+ New SKU</button>
      </div>

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
