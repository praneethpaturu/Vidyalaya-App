import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Download } from "lucide-react";

const TYPES = [
  { key: "RECEIPTS", label: "Fee receipts", desc: "Receipt vouchers — one per Payment row" },
  { key: "PAYMENTS", label: "Expense payments", desc: "Payment vouchers — one per Expense row" },
  { key: "VOUCHERS", label: "All vouchers (combined)", desc: "Receipts + payments together" },
  { key: "LEDGERS",  label: "Ledger masters", desc: "Vendors + students + expense heads" },
];

export const dynamic = "force-dynamic";

function defaultRange() {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    from: first.toISOString().slice(0, 10),
    to:   today.toISOString().slice(0, 10),
  };
}

export default async function TallyExportPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const past = await prisma.tallyExport.findMany({
    where: { schoolId: u.schoolId },
    orderBy: { generatedAt: "desc" },
    take: 30,
  });
  const range = defaultRange();

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="h-page mb-1">Tally ERP export</h1>
      <p className="muted mb-4">
        Tally Prime-ready XML. Download the file and use <span className="font-mono">Gateway of Tally → Import → Data → XML</span>.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {TYPES.map((t) => (
          <form key={t.key} method="get" action={`/api/finance/tally/${t.key.toLowerCase()}`} className="card card-pad">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-medium">{t.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
              </div>
            </div>
            {t.key !== "LEDGERS" && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <input type="date" name="from" defaultValue={range.from} className="input text-sm" />
                <input type="date" name="to"   defaultValue={range.to}   className="input text-sm" />
              </div>
            )}
            <button type="submit" className="btn-tonal text-sm inline-flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Download XML
            </button>
          </form>
        ))}
      </div>

      <h2 className="h-section mb-2">Past exports</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Type</th><th>Range</th><th>Rows</th><th>Generated</th></tr></thead>
          <tbody>
            {past.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-8">No exports yet.</td></tr>}
            {past.map((e) => (
              <tr key={e.id}>
                <td><span className="badge-blue text-xs">{e.type}</span></td>
                <td className="text-xs">
                  {new Date(e.fromDate).toLocaleDateString("en-IN")} → {new Date(e.toDate).toLocaleDateString("en-IN")}
                </td>
                <td>{e.rowCount}</td>
                <td className="text-xs">{new Date(e.generatedAt).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
