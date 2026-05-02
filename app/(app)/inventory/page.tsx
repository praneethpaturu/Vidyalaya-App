import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePageRole } from "@/lib/auth";
import { inr } from "@/lib/utils";
import { Boxes, Plus, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

export default async function InventoryPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "INVENTORY_MANAGER", "HR_MANAGER"]);
  const sId = u.schoolId;
  const items = await prisma.inventoryItem.findMany({ where: { schoolId: sId }, orderBy: { name: "asc" } });
  const cats = Array.from(new Set(items.map((i) => i.category)));

  const stockValue = items.reduce((s, i) => s + i.qtyOnHand * i.unitCost, 0);
  const lowStock = items.filter((i) => i.qtyOnHand <= i.reorderLevel);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page">Inventory</h1>
          <p className="muted mt-1">{items.length} SKUs · {cats.length} categories</p>
        </div>
        <Link href="/inventory/po" className="btn-primary"><Plus className="w-4 h-4" /> New PO</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card card-pad">
          <div className="flex items-center gap-2"><Boxes className="w-5 h-5 text-brand-700" /><div className="text-sm text-slate-500">Stock value</div></div>
          <div className="kpi-num mt-2">{inr(stockValue)}</div>
        </div>
        <div className="card card-pad">
          <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-600" /><div className="text-sm text-slate-500">Low stock items</div></div>
          <div className="kpi-num mt-2 text-rose-700">{lowStock.length}</div>
        </div>
        <Link href="/inventory/po" className="card card-pad hover:shadow-cardHover transition">
          <div className="text-sm text-slate-500">Purchase orders</div>
          <div className="text-base font-medium mt-2">View & create POs →</div>
        </Link>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th><th>Item</th><th>Category</th>
              <th className="text-right">Qty</th><th className="text-right">Reorder at</th>
              <th className="text-right">Unit cost</th><th className="text-right">Value</th><th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const low = i.qtyOnHand <= i.reorderLevel;
              return (
                <tr key={i.id}>
                  <td className="font-mono text-xs">{i.sku}</td>
                  <td>{i.name}</td>
                  <td><span className="badge-slate">{i.category}</span></td>
                  <td className={`text-right font-medium ${low ? "text-rose-700" : ""}`}>{i.qtyOnHand} <span className="text-xs text-slate-400">{i.unit}</span></td>
                  <td className="text-right text-slate-500">{i.reorderLevel}</td>
                  <td className="text-right">{inr(i.unitCost)}</td>
                  <td className="text-right">{inr(i.qtyOnHand * i.unitCost)}</td>
                  <td className="text-right">{low && <span className="badge-red">Low</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
