import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";
import { Wallet, TrendingUp, AlertTriangle, ArrowDownToLine, Receipt } from "lucide-react";

// Fee Day Sheet — section 6 of PRD: Today / 7 days / FY collections / FY advances / Refundable.

export default async function FinanceFeeDaySheetPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const sId = u.schoolId;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const fyStart = new Date(today.getFullYear(), 3, 1);
  if (today.getMonth() < 3) fyStart.setFullYear(today.getFullYear() - 1);

  const [todayPay, weekPay, fyPay, totals, overdue, recent] = await Promise.all([
    prisma.payment.aggregate({
      where: { schoolId: sId, status: "SUCCESS", paidAt: { gte: today, lt: tomorrow } },
      _sum: { amount: true }, _count: true,
    }),
    prisma.payment.aggregate({
      where: { schoolId: sId, status: "SUCCESS", paidAt: { gte: sevenDaysAgo, lt: tomorrow } },
      _sum: { amount: true }, _count: true,
    }),
    prisma.payment.aggregate({
      where: { schoolId: sId, status: "SUCCESS", paidAt: { gte: fyStart } },
      _sum: { amount: true }, _count: true,
    }),
    prisma.invoice.aggregate({
      where: { schoolId: sId, status: { in: ["ISSUED", "PARTIAL"] } },
      _sum: { total: true, amountPaid: true },
    }),
    prisma.invoice.count({ where: { schoolId: sId, status: "OVERDUE" } }),
    prisma.payment.findMany({
      where: { schoolId: sId },
      include: { invoice: { include: { student: { include: { user: true, class: true } } } } },
      orderBy: { paidAt: "desc" },
      take: 10,
    }),
  ]);

  const dues = (totals._sum.total ?? 0) - (totals._sum.amountPaid ?? 0);

  // 7-day buckets
  const dayBuckets: { date: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dn = new Date(d); dn.setDate(d.getDate() + 1);
    const agg = await prisma.payment.aggregate({
      where: { schoolId: sId, status: "SUCCESS", paidAt: { gte: d, lt: dn } },
      _sum: { amount: true },
    });
    dayBuckets.push({ date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), amount: agg._sum.amount ?? 0 });
  }
  const maxBucket = Math.max(...dayBuckets.map((b) => b.amount), 1);

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="h-page">Fee Day Sheet</h1>
          <p className="muted">Today, last 7 days and FY collections at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/payments" className="btn-outline">Payments</Link>
          <Link href="/fees" className="btn-primary">All Invoices</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <KpiCard icon={Wallet} label="Today" amount={inr(todayPay._sum.amount ?? 0)} sub={`${todayPay._count} txn`} tone="blue" />
        <KpiCard icon={TrendingUp} label="Collections (7 days)" amount={inr(weekPay._sum.amount ?? 0)} sub={`${weekPay._count} txn`} tone="emerald" />
        <KpiCard icon={Receipt} label="FY Collections" amount={inr(fyPay._sum.amount ?? 0)} sub={`since ${fyStart.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}`} tone="violet" />
        <KpiCard icon={AlertTriangle} label="Outstanding" amount={inr(dues)} sub="Issued + Partial" tone="amber" />
        <KpiCard icon={ArrowDownToLine} label="Overdue Invoices" amount={overdue.toString()} sub="Past due date" tone="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="card lg:col-span-2">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">Last 7 days collections</div>
          <div className="p-4 grid grid-cols-7 gap-2 items-end h-48">
            {dayBuckets.map((b) => (
              <div key={b.date} className="flex flex-col items-center justify-end h-full">
                <div
                  className="w-full bg-gradient-to-t from-brand-300 to-brand-600 rounded-t-md"
                  style={{ height: `${Math.max(2, (b.amount / maxBucket) * 100)}%` }}
                  title={inr(b.amount)}
                />
                <div className="text-[10px] text-slate-500 mt-1">{b.date}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">Online Payment Gateways</div>
          <ul className="divide-y divide-slate-100 text-sm">
            <li className="px-4 py-3 flex items-center justify-between">
              <span>Razorpay</span><span className="badge-green">Configured</span>
            </li>
            <li className="px-4 py-3 flex items-center justify-between">
              <span>PayU</span><span className="badge-slate">Available</span>
            </li>
            <li className="px-4 py-3 flex items-center justify-between">
              <span>CC Avenue</span><span className="badge-slate">Available</span>
            </li>
            <li className="px-4 py-3 flex items-center justify-between">
              <span>Paytm</span><span className="badge-slate">Available</span>
            </li>
          </ul>
          <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-t border-amber-100">
            New payment gateway? <a className="underline" href="#">Help guide</a>
          </div>
        </div>
      </div>

      <h2 className="h-section mb-2">Recent receipts</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Receipt</th><th>Student</th><th>Class</th><th>Method</th><th>Status</th><th>Time</th><th className="text-right">Amount</th></tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr><td colSpan={7} className="text-center text-slate-500 py-8">No Data Found</td></tr>
            )}
            {recent.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs">{p.receiptNo}</td>
                <td>{p.invoice?.student.user.name ?? "—"}</td>
                <td className="text-xs">{p.invoice?.student.class?.name ?? "—"}</td>
                <td><span className="badge-blue">{p.method}</span></td>
                <td><span className={p.status === "SUCCESS" ? "badge-green" : p.status === "FAILED" ? "badge-red" : "badge-amber"}>{p.status}</span></td>
                <td className="text-xs text-slate-500">{new Date(p.paidAt).toLocaleString("en-IN")}</td>
                <td className="text-right font-medium">{inr(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, amount, sub, tone }: { icon: any; label: string; amount: string; sub: string; tone: string }) {
  const tones: Record<string, string> = {
    blue: "bg-brand-50 text-brand-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <div className="card card-pad">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500 truncate">{label}</div>
          <div className="text-xl font-medium tracking-tight mt-1 truncate">{amount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
        </div>
        <div className={`w-9 h-9 rounded-xl ${tones[tone]} flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
