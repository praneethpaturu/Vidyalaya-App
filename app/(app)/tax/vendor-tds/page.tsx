import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDate, inr } from "@/lib/utils";
import { recordVendorTds } from "@/app/actions/tax";
import { SECTION_DESCRIPTIONS } from "@/lib/vendor-tds";

export default async function VendorTdsPage() {
  const session = await auth();
  const u = session!.user as any;
  const [vendors, deductions] = await Promise.all([
    prisma.vendor.findMany({ where: { schoolId: u.schoolId }, orderBy: { name: "asc" } }),
    prisma.vendorTdsDeduction.findMany({
      where: { schoolId: u.schoolId },
      include: { vendor: true },
      orderBy: { paidAt: "desc" },
      take: 100,
    }),
  ]);

  const totalGross = deductions.reduce((s, d) => s + d.grossAmount, 0);
  const totalTds = deductions.reduce((s, d) => s + d.tdsAmount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Tile label="Total payments" value={inr(totalGross)} />
            <Tile label="TDS deducted" value={inr(totalTds)} tone="red" />
            <Tile label="Effective rate" value={totalGross > 0 ? `${(totalTds/totalGross*100).toFixed(2)}%` : "—"} />
          </div>
          <div className="card">
            <div className="p-4 border-b border-slate-100"><h3 className="h-section">Recent vendor TDS deductions</h3></div>
            <table className="table">
              <thead><tr><th>Date</th><th>Vendor</th><th>Section</th><th>Nature</th><th className="text-right">Gross</th><th>Rate</th><th className="text-right">TDS</th><th className="text-right">Net</th></tr></thead>
              <tbody>
                {deductions.map((d) => (
                  <tr key={d.id}>
                    <td className="text-slate-600">{fmtDate(d.paidAt)}</td>
                    <td>{d.vendor.name}</td>
                    <td><span className="badge-blue">s{d.section}</span></td>
                    <td className="text-slate-600 max-w-[200px] truncate">{d.natureOfPayment}</td>
                    <td className="text-right">{inr(d.grossAmount)}</td>
                    <td>{d.tdsRate}%</td>
                    <td className="text-right text-rose-700">{inr(d.tdsAmount)}</td>
                    <td className="text-right">{inr(d.netAmount)}</td>
                  </tr>
                ))}
                {deductions.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-slate-500">No deductions yet — use the form on the right.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="h-section mb-3">Pay vendor (with TDS)</h2>
          <form action={recordVendorTds} className="card card-pad space-y-3">
            <div>
              <label className="label">Vendor</label>
              <select className="input" name="vendorId" required>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Section</label>
              <select className="input" name="section" defaultValue="194C">
                {(["194C","194J","194I","194H","194A"] as const).map((s) => (
                  <option key={s} value={s}>s{s} — {SECTION_DESCRIPTIONS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Nature of payment</label>
              <input className="input" name="natureOfPayment" placeholder="e.g. Stationery supply, Annual maintenance" required />
            </div>
            <div>
              <label className="label">Gross amount (₹)</label>
              <input className="input" name="grossAmount" type="number" min={0} step="0.01" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Deductee type (s194C)</label>
                <select className="input" name="deducteeType">
                  <option value="OTHER">Other (2%)</option>
                  <option value="INDIVIDUAL_HUF">Individual / HUF (1%)</option>
                </select>
              </div>
              <div>
                <label className="label">Rent class (s194I)</label>
                <select className="input" name="rentClass">
                  <option value="LAND_BUILDING_FURNITURE">Land/Building/Furniture (10%)</option>
                  <option value="PLANT_MACHINERY">Plant & Machinery (2%)</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="panFurnished" defaultChecked /> PAN furnished by vendor (else s.206AA → 20% / 2× rate)
            </label>
            <div>
              <label className="label">Invoice ref (optional)</label>
              <input className="input" name="invoiceRef" placeholder="VND-INV-001" />
            </div>
            <button className="btn-primary w-full">Calculate & record</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, tone }: any) {
  const t = tone === "red" ? "text-rose-700" : "text-slate-900";
  return <div className="card card-pad"><div className="text-xs text-slate-500">{label}</div><div className={`kpi-num mt-1 ${t}`}>{value}</div></div>;
}
