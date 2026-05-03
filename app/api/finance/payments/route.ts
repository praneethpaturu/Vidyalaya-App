import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// POST /api/finance/payments
// Body: { studentId, invoiceIds: string[], amountRupees: number, method: string, txnRef?: string }
//
// Distributes the amount across the selected invoices in dueDate order, smallest
// outstanding balance first within each invoice (i.e., FIFO). Updates each
// Invoice's amountPaid + status; creates a single Payment row per invoice
// touched. Receipt number is human-readable: RCT-YYYY-NNNNN.

export async function POST(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const body = await req.json().catch(() => ({}));
  const studentId = String(body?.studentId ?? "");
  const invoiceIds: string[] = Array.isArray(body?.invoiceIds) ? body.invoiceIds : [];
  const amountPaise = Math.round(Number(body?.amountRupees ?? 0) * 100);
  const method = String(body?.method ?? "CASH");
  const txnRef = body?.txnRef ? String(body.txnRef) : null;

  if (!studentId || invoiceIds.length === 0 || amountPaise <= 0) {
    return NextResponse.json({ ok: false, error: "missing-params" }, { status: 400 });
  }
  if (!["CASH","UPI","CARD","NETBANKING","CHEQUE","RAZORPAY"].includes(method)) {
    return NextResponse.json({ ok: false, error: "bad-method" }, { status: 400 });
  }

  const stu = await prisma.student.findFirst({ where: { id: studentId, schoolId: u.schoolId } });
  if (!stu) return NextResponse.json({ ok: false, error: "no-student" }, { status: 404 });

  const invoices = await prisma.invoice.findMany({
    where: { id: { in: invoiceIds }, schoolId: u.schoolId, studentId, status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] } },
    orderBy: { dueDate: "asc" },
  });
  if (invoices.length === 0) {
    return NextResponse.json({ ok: false, error: "no-open-invoices" }, { status: 400 });
  }

  // Generate a receipt number for the whole collection. We attach it to the
  // last payment's receiptNo and append "-A", "-B"… to the others if multiple.
  const today = new Date();
  const seq = await prisma.payment.count({ where: { schoolId: u.schoolId } });
  const receiptBase = `RCT-${today.getFullYear()}-${String(seq + 1).padStart(5, "0")}`;

  let remaining = amountPaise;
  const payments: { invoiceId: string; amount: number; receiptNo: string }[] = [];

  await prisma.$transaction(async (tx) => {
    for (let idx = 0; idx < invoices.length && remaining > 0; idx++) {
      const inv = invoices[idx];
      const balance = inv.total - inv.amountPaid;
      if (balance <= 0) continue;
      const apply = Math.min(remaining, balance);
      remaining -= apply;
      const receiptNo = invoices.length === 1 ? receiptBase : `${receiptBase}-${String.fromCharCode(65 + idx)}`;

      await tx.payment.create({
        data: {
          schoolId: u.schoolId,
          invoiceId: inv.id,
          receiptNo,
          amount: apply,
          method,
          status: "SUCCESS",
          txnRef,
          paidAt: new Date(),
        },
      });
      const newPaid = inv.amountPaid + apply;
      const newStatus = newPaid >= inv.total ? "PAID" : "PARTIAL";
      await tx.invoice.update({
        where: { id: inv.id },
        data: { amountPaid: newPaid, status: newStatus },
      });
      payments.push({ invoiceId: inv.id, amount: apply, receiptNo });
    }
  });

  return NextResponse.json({ ok: true, receiptNo: receiptBase, payments, leftover: remaining });
}
