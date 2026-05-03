import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

async function addAsset(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "INVENTORY_MANAGER"]);
  const assetCode = String(form.get("assetCode") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const purchaseDate = String(form.get("purchaseDate") ?? "");
  const purchaseCost = Math.round(Number(form.get("purchaseCost") ?? 0) * 100);
  if (!assetCode || !name || !purchaseDate || purchaseCost <= 0) return;
  await prisma.fixedAsset.create({
    data: {
      schoolId: u.schoolId,
      assetCode, name,
      category: String(form.get("category") ?? "OTHER"),
      purchaseDate: new Date(purchaseDate),
      purchaseCost,
      vendor: String(form.get("vendor") ?? "") || null,
      location: String(form.get("location") ?? "") || null,
      depreciationMethod: String(form.get("depreciationMethod") ?? "STRAIGHT_LINE"),
      usefulLifeYears: Number(form.get("usefulLifeYears") ?? 5),
      wdvRatePct: Number(form.get("wdvRatePct") ?? 15),
      salvageValue: Math.round(Number(form.get("salvageValue") ?? 0) * 100),
    },
  }).catch(() => {});
  revalidatePath("/Home/Finance/assets");
  redirect("/Home/Finance/assets?added=1");
}

async function depreciateAll(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const fy = String(form.get("fy") ?? "").trim();
  if (!fy) return;
  const assets = await prisma.fixedAsset.findMany({
    where: { schoolId: u.schoolId, status: "ACTIVE" },
    include: { entries: true },
  });
  for (const a of assets) {
    const exists = a.entries.find((e) => e.fy === fy);
    if (exists) continue;
    const totalDepr = a.entries.reduce((s, e) => s + e.amount, 0);
    const bookValue = Math.max(0, a.purchaseCost - totalDepr);
    let amount = 0;
    if (a.depreciationMethod === "WDV") {
      amount = Math.round(bookValue * (a.wdvRatePct / 100));
    } else {
      // Straight line
      const annual = Math.max(0, Math.round((a.purchaseCost - a.salvageValue) / Math.max(1, a.usefulLifeYears)));
      amount = Math.min(annual, bookValue);
    }
    if (amount <= 0) continue;
    const newBookValue = bookValue - amount;
    await prisma.assetDepreciationEntry.create({
      data: {
        assetId: a.id, fy, amount, method: a.depreciationMethod, bookValueAfter: newBookValue,
      },
    });
  }
  revalidatePath("/Home/Finance/assets");
  redirect(`/Home/Finance/assets?depreciated=${fy}`);
}

async function disposeAsset(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const id = String(form.get("id"));
  await prisma.fixedAsset.updateMany({
    where: { id, schoolId: u.schoolId },
    data: { status: "DISPOSED", disposedAt: new Date(), disposalNotes: String(form.get("notes") ?? "") || null },
  });
  revalidatePath("/Home/Finance/assets");
}

export const dynamic = "force-dynamic";

export default async function AssetsPage({
  searchParams,
}: { searchParams: Promise<{ added?: string; depreciated?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "INVENTORY_MANAGER"]);
  const sp = await searchParams;
  const today = new Date();
  const fyDefault = today.getMonth() < 3
    ? `${today.getFullYear() - 1}-${String(today.getFullYear()).slice(-2)}`
    : `${today.getFullYear()}-${String(today.getFullYear() + 1).slice(-2)}`;

  const assets = await prisma.fixedAsset.findMany({
    where: { schoolId: u.schoolId },
    include: { entries: true },
    orderBy: { createdAt: "desc" },
  });

  const totalCost = assets.reduce((s, a) => s + a.purchaseCost, 0);
  const totalDepr = assets.reduce((s, a) => s + a.entries.reduce((b, e) => b + e.amount, 0), 0);
  const wdv = totalCost - totalDepr;

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-1">Fixed assets register</h1>
      <p className="muted mb-3">SLM / WDV depreciation. Run year-end accrual to record per-FY entries.</p>
      {sp.added && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Asset added.</div>}
      {sp.depreciated && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">FY {sp.depreciated} depreciation recorded.</div>}

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Total cost</div><div className="text-xl font-medium">{inr(totalCost)}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Accumulated depr.</div><div className="text-xl font-medium text-rose-700">{inr(totalDepr)}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Book value</div><div className="text-xl font-medium text-emerald-700">{inr(wdv)}</div></div>
      </div>

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ Register new asset</summary>
        <form action={addAsset} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <div><label className="label">Asset code *</label><input required name="assetCode" className="input" placeholder="FA-2026-001" /></div>
          <div className="md:col-span-2"><label className="label">Name *</label><input required name="name" className="input" /></div>
          <div>
            <label className="label">Category</label>
            <select name="category" className="input" defaultValue="OTHER">
              <option>FURNITURE</option><option>ELECTRONICS</option><option>VEHICLES</option>
              <option>BUILDING</option><option>EQUIPMENT</option><option>OTHER</option>
            </select>
          </div>
          <div><label className="label">Purchase date *</label><input required type="date" name="purchaseDate" className="input" /></div>
          <div><label className="label">Cost (₹) *</label><input required type="number" min={0} step={1} name="purchaseCost" className="input" /></div>
          <div><label className="label">Vendor</label><input name="vendor" className="input" /></div>
          <div><label className="label">Location</label><input name="location" className="input" placeholder="Block A · Lab 2" /></div>
          <div>
            <label className="label">Method</label>
            <select name="depreciationMethod" className="input" defaultValue="STRAIGHT_LINE">
              <option value="STRAIGHT_LINE">Straight-line</option>
              <option value="WDV">WDV (% of book value)</option>
            </select>
          </div>
          <div><label className="label">Useful life (yrs, SLM)</label><input type="number" min={1} max={50} name="usefulLifeYears" defaultValue={5} className="input" /></div>
          <div><label className="label">WDV rate %</label><input type="number" step="0.5" min={0} max={50} name="wdvRatePct" defaultValue={15} className="input" /></div>
          <div><label className="label">Salvage value (₹)</label><input type="number" min={0} step={1} name="salvageValue" defaultValue={0} className="input" /></div>
          <button type="submit" className="btn-primary md:col-span-3">Save asset</button>
        </form>
      </details>

      <form action={depreciateAll} className="card card-pad mb-5 flex gap-3 items-end">
        <div className="flex-1">
          <label className="label">FY for year-end depreciation</label>
          <input name="fy" defaultValue={fyDefault} className="input" placeholder="2026-27" />
          <p className="text-xs text-slate-500 mt-1">Idempotent — assets already depreciated for this FY are skipped.</p>
        </div>
        <button type="submit" className="btn-tonal">Run depreciation</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th><th>Name</th><th>Category</th><th>Purchase</th>
              <th className="text-right">Cost</th><th className="text-right">Accum depr</th>
              <th className="text-right">WDV</th><th>Method</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 && <tr><td colSpan={10} className="text-center text-slate-500 py-8">No assets registered.</td></tr>}
            {assets.map((a) => {
              const accum = a.entries.reduce((s, e) => s + e.amount, 0);
              const value = Math.max(0, a.purchaseCost - accum);
              return (
                <tr key={a.id}>
                  <td className="font-mono text-xs">{a.assetCode}</td>
                  <td className="font-medium">{a.name}</td>
                  <td><span className="badge-slate text-xs">{a.category}</span></td>
                  <td className="text-xs">{new Date(a.purchaseDate).toLocaleDateString("en-IN")}</td>
                  <td className="text-right">{inr(a.purchaseCost)}</td>
                  <td className="text-right text-rose-700">{inr(accum)}</td>
                  <td className="text-right text-emerald-700">{inr(value)}</td>
                  <td className="text-xs">{a.depreciationMethod}</td>
                  <td>
                    <span className={
                      a.status === "DISPOSED" ? "badge-red" :
                      a.status === "SCRAPPED" ? "badge-slate" : "badge-green"
                    }>{a.status}</span>
                  </td>
                  <td className="text-right">
                    <Link href={`/Home/Finance/assets/${a.id}`} className="text-brand-700 text-xs hover:underline">Open</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
