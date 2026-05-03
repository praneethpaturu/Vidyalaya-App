import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

async function manualMatch(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const rowId = String(form.get("rowId"));
  const paymentId = String(form.get("paymentId") ?? "");
  const importId = String(form.get("importId"));
  const row = await prisma.bankStatementRow.findUnique({ where: { id: rowId } });
  if (!row) return;
  const job = await prisma.bankStatementImport.findFirst({ where: { id: row.importId, schoolId: u.schoolId } });
  if (!job) return;
  if (paymentId) {
    const p = await prisma.payment.findFirst({ where: { id: paymentId, schoolId: u.schoolId } });
    if (!p) return;
    await prisma.bankStatementRow.update({
      where: { id: rowId },
      data: { matchedPaymentId: p.id, status: "MATCHED" },
    });
    if (row.status !== "MATCHED") {
      await prisma.bankStatementImport.update({
        where: { id: job.id },
        data: { matchedCount: { increment: 1 }, unmatchedCount: { decrement: 1 } },
      });
    }
  } else {
    // Mark IGNORED
    await prisma.bankStatementRow.update({
      where: { id: rowId },
      data: { status: "IGNORED", matchedPaymentId: null },
    });
    if (row.status === "UNMATCHED") {
      await prisma.bankStatementImport.update({
        where: { id: job.id },
        data: { unmatchedCount: { decrement: 1 } },
      });
    }
  }
  revalidatePath(`/Home/Finance/reconciliation/${importId}`);
}

export const dynamic = "force-dynamic";

export default async function ReconDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const { id } = await params;
  const job = await prisma.bankStatementImport.findFirst({
    where: { id, schoolId: u.schoolId },
    include: { rows: { orderBy: { txnDate: "asc" } } },
  });
  if (!job) notFound();

  // Pull recent payments without an existing match in this import for the
  // manual-match dropdown.
  const matchedIds = new Set(job.rows.map((r) => r.matchedPaymentId).filter(Boolean));
  const oldest = new Date();
  oldest.setMonth(oldest.getMonth() - 6);
  const payments = await prisma.payment.findMany({
    where: { schoolId: u.schoolId, paidAt: { gte: oldest } },
    orderBy: { paidAt: "desc" },
    take: 200,
  });

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <Link href="/Home/Finance/reconciliation" className="text-xs text-brand-700 hover:underline">← Back to imports</Link>
      <div className="mt-1 mb-4 flex items-end justify-between">
        <div>
          <h1 className="h-page">{job.fileName ?? "Statement"}</h1>
          <p className="muted">
            {job.rowCount} rows · {job.matchedCount} auto-matched · {job.unmatchedCount} need review
          </p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th><th>Description</th><th>Reference</th>
              <th className="text-right">Debit</th><th className="text-right">Credit</th>
              <th>Status</th><th>Match</th>
            </tr>
          </thead>
          <tbody>
            {job.rows.map((r) => (
              <tr key={r.id}>
                <td className="text-xs">{new Date(r.txnDate).toLocaleDateString("en-IN")}</td>
                <td className="max-w-xs truncate">{r.description}</td>
                <td className="font-mono text-xs">{r.reference ?? "—"}</td>
                <td className="text-right text-rose-700">{r.debit > 0 ? inr(r.debit) : ""}</td>
                <td className="text-right text-emerald-700">{r.credit > 0 ? inr(r.credit) : ""}</td>
                <td>
                  <span className={
                    r.status === "MATCHED" ? "badge-green" :
                    r.status === "IGNORED" ? "badge-slate" : "badge-amber"
                  }>{r.status}</span>
                </td>
                <td>
                  <form action={manualMatch} className="flex gap-1">
                    <input type="hidden" name="rowId" value={r.id} />
                    <input type="hidden" name="importId" value={job.id} />
                    <select name="paymentId" defaultValue={r.matchedPaymentId ?? ""} className="input text-xs">
                      <option value="">— ignore / unmatch —</option>
                      {payments.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.receiptNo} · {inr(p.amount)} · {new Date(p.paidAt).toLocaleDateString("en-IN")}
                        </option>
                      ))}
                    </select>
                    <button className="btn-tonal text-xs px-2 py-1" type="submit">Save</button>
                  </form>
                </td>
              </tr>
            ))}
            {job.rows.length === 0 && (
              <tr><td colSpan={7} className="text-center text-slate-500 py-8">No rows.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
