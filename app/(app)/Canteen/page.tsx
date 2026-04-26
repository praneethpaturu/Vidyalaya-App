import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

export default async function CanteenPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const [items, txns] = await Promise.all([
    prisma.canteenItem.findMany({ where: { schoolId: sId, available: true } }),
    prisma.canteenTransaction.findMany({ where: { schoolId: sId }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todaySales = txns.filter((t) => t.type === "CHARGE" && new Date(t.createdAt) >= today);
  const totalToday = todaySales.reduce((s, t) => s + t.amount, 0);
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Canteen</h1>
          <p className="muted">Menu, cashless wallet (RFID/biometric), daily sales, parent top-up.</p>
        </div>
        <button className="btn-primary">+ New menu item</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Today's sales</div><div className="text-2xl font-medium">{inr(totalToday)}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Items on menu</div><div className="text-2xl font-medium">{items.length}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Veg / Non-veg</div><div className="text-2xl font-medium">{items.filter((i) => i.isVeg).length}/{items.filter((i) => !i.isVeg).length}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Today txns</div><div className="text-2xl font-medium">{todaySales.length}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card overflow-x-auto">
          <div className="px-4 py-3 border-b text-sm font-medium">Today's menu</div>
          <table className="table">
            <thead><tr><th>Name</th><th>Category</th><th>Veg</th><th className="text-right">Price</th></tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-8">No items.</td></tr>}
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="font-medium">{i.name}</td>
                  <td className="text-xs"><span className="badge-slate">{i.category ?? "—"}</span></td>
                  <td>{i.isVeg ? <span className="badge-green">Veg</span> : <span className="badge-amber">Non-veg</span>}</td>
                  <td className="text-right">{inr(i.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card overflow-x-auto">
          <div className="px-4 py-3 border-b text-sm font-medium">Recent wallet activity</div>
          <table className="table">
            <thead><tr><th>Type</th><th className="text-right">Amount</th><th className="text-right">Balance</th><th>When</th></tr></thead>
            <tbody>
              {txns.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-8">No activity.</td></tr>}
              {txns.map((t) => (
                <tr key={t.id}>
                  <td><span className={t.type === "TOPUP" ? "badge-green" : t.type === "CHARGE" ? "badge-blue" : "badge-slate"}>{t.type}</span></td>
                  <td className="text-right">{inr(t.amount)}</td>
                  <td className="text-right">{inr(t.balance)}</td>
                  <td className="text-xs">{new Date(t.createdAt).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
