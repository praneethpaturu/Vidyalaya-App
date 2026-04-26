import Link from "next/link";

const REPORTS = [
  { label: "Day Book", desc: "Cashier-wise daily collections", href: "/Home/Finance/collections" },
  { label: "Mode-wise Collection", desc: "Cash / UPI / Card / NEFT / Cheque / Online", href: "/Home/Finance/collections" },
  { label: "Concession Report", desc: "By type, by class", href: "/Home/Finance/concessions" },
  { label: "Scholarship Report", desc: "Disbursed vs sanctioned", href: "/Home/Finance/scholarship" },
  { label: "Dues / Ageing Buckets", desc: "1-30, 31-60, 61-90, 90+", href: "/Home/Finance/dues" },
  { label: "Receipt Cancellation Log", desc: "Audit trail of voided receipts", href: "/Home/Finance/audit" },
];

export default function FinanceReportsPage() {
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-4">Finance Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {REPORTS.map((r) => (
          <Link key={r.label} href={r.href} className="card card-pad hover:bg-slate-50 transition">
            <div className="text-base font-medium">{r.label}</div>
            <div className="text-xs text-slate-500 mt-1">{r.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
