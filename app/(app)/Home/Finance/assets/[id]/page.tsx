import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

async function disposeAsset(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const id = String(form.get("id"));
  await prisma.fixedAsset.updateMany({
    where: { id, schoolId: u.schoolId },
    data: { status: "DISPOSED", disposedAt: new Date(), disposalNotes: String(form.get("notes") ?? "") || null },
  });
  revalidatePath(`/Home/Finance/assets/${id}`);
  redirect("/Home/Finance/assets");
}

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "INVENTORY_MANAGER"]);
  const { id } = await params;
  const a = await prisma.fixedAsset.findFirst({
    where: { id, schoolId: u.schoolId },
    include: { entries: { orderBy: { fy: "asc" } } },
  });
  if (!a) notFound();
  const accum = a.entries.reduce((s, e) => s + e.amount, 0);
  const wdv = Math.max(0, a.purchaseCost - accum);

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <Link href="/Home/Finance/assets" className="text-xs text-brand-700 hover:underline">← Back</Link>
      <h1 className="h-page mt-1 mb-1">{a.name}</h1>
      <p className="muted mb-4">{a.assetCode} · {a.category} · purchased {new Date(a.purchaseDate).toLocaleDateString("en-IN")}</p>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Cost</div><div className="text-xl font-medium">{inr(a.purchaseCost)}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Accumulated</div><div className="text-xl font-medium text-rose-700">{inr(accum)}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Book value</div><div className="text-xl font-medium text-emerald-700">{inr(wdv)}</div></div>
      </div>

      <h2 className="h-section mb-2">Depreciation entries</h2>
      <div className="card overflow-x-auto mb-5">
        <table className="table">
          <thead><tr><th>FY</th><th>Method</th><th className="text-right">Amount</th><th className="text-right">Book value after</th><th>Recorded</th></tr></thead>
          <tbody>
            {a.entries.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">No entries yet.</td></tr>}
            {a.entries.map((e) => (
              <tr key={e.id}>
                <td>{e.fy}</td>
                <td><span className="badge-slate text-xs">{e.method}</span></td>
                <td className="text-right text-rose-700">{inr(e.amount)}</td>
                <td className="text-right">{inr(e.bookValueAfter)}</td>
                <td className="text-xs">{new Date(e.recordedAt).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {a.status === "ACTIVE" && (
        <details className="card card-pad">
          <summary className="cursor-pointer text-rose-700">Dispose / scrap this asset</summary>
          <form action={disposeAsset} className="mt-3 space-y-2">
            <input type="hidden" name="id" value={a.id} />
            <input name="notes" className="input" placeholder="Disposal notes" />
            <button type="submit" className="btn-outline text-rose-700">Mark as disposed</button>
          </form>
        </details>
      )}
    </div>
  );
}
