import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";
import CollectClient from "./CollectClient";

export const dynamic = "force-dynamic";

export default async function CollectStudentPage({
  params, searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const { studentId } = await params;
  const sp = await searchParams;

  const stu = await prisma.student.findFirst({
    where: { id: studentId, schoolId: u.schoolId },
    include: { user: true, class: true },
  });
  if (!stu) notFound();

  const invoices = await prisma.invoice.findMany({
    where: {
      schoolId: u.schoolId,
      studentId: stu.id,
      status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] },
    },
    orderBy: { dueDate: "asc" },
  });
  const recent = await prisma.payment.findMany({
    where: { schoolId: u.schoolId, invoice: { studentId: stu.id } },
    orderBy: { paidAt: "desc" },
    include: { invoice: { select: { number: true } } },
    take: 20,
  });

  const totalDue = invoices.reduce((s, i) => s + (i.total - i.amountPaid), 0);

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <Link href="/Home/Finance/collect" className="text-xs text-brand-700 hover:underline">← Back to search</Link>
      <div className="mt-1 mb-4">
        <h1 className="h-page">{stu.user.name}</h1>
        <p className="muted">
          {stu.admissionNo} · {stu.class?.name ?? "—"} · Outstanding {inr(totalDue)}
        </p>
      </div>

      {sp.paid && (
        <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">
          Receipt <span className="font-mono">{sp.paid}</span> recorded.
        </div>
      )}

      <CollectClient
        studentId={stu.id}
        invoices={invoices.map((i) => ({
          id: i.id,
          number: i.number,
          dueDate: i.dueDate.toISOString(),
          total: i.total,
          amountPaid: i.amountPaid,
          balance: i.total - i.amountPaid,
          status: i.status,
        }))}
      />

      <h2 className="h-section mt-8 mb-2">Recent receipts</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Receipt</th><th>Invoice</th><th className="text-right">Amount</th><th>Method</th><th>Paid</th><th></th></tr></thead>
          <tbody>
            {recent.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No receipts.</td></tr>}
            {recent.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs">{p.receiptNo}</td>
                <td className="font-mono text-xs">{p.invoice?.number ?? "—"}</td>
                <td className="text-right">{inr(p.amount)}</td>
                <td><span className="badge-blue text-xs">{p.method}</span></td>
                <td className="text-xs">{new Date(p.paidAt).toLocaleString("en-IN")}</td>
                <td className="text-right">
                  <a href={`/api/payments/${p.id}/receipt`} target="_blank" className="text-brand-700 text-xs hover:underline">Receipt PDF</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
