import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify, templates } from "@/lib/notify";
import { inr, fmtDate } from "@/lib/utils";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const sId = (session.user as any).schoolId;

  const { invoiceId, amount, method } = await req.json();
  const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!inv) return NextResponse.json({ error: "no invoice" }, { status: 404 });

  // Receipt sequence
  const last = await prisma.payment.findFirst({
    where: { schoolId: sId },
    orderBy: { receiptNo: "desc" },
  });
  const lastNum = last?.receiptNo?.match(/(\d+)$/)?.[1] ?? "0";
  const next = String(parseInt(lastNum) + 1).padStart(4, "0");
  const receiptNo = `RCP-${new Date().getFullYear()}-${next}`;

  const txnRef = `pay_${Math.random().toString(36).slice(2, 14)}`;

  const payment = await prisma.payment.create({
    data: {
      schoolId: sId,
      invoiceId,
      receiptNo,
      amount,
      method: method ?? "RAZORPAY",
      status: "SUCCESS",
      txnRef,
    },
  });

  const newPaid = inv.amountPaid + amount;
  const newStatus = newPaid >= inv.total ? "PAID" : newPaid > 0 ? "PARTIAL" : "ISSUED";
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { amountPaid: newPaid, status: newStatus },
  });

  // Audit + notify the student/parent
  const detail = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { student: { include: { user: true, guardians: { include: { guardian: { include: { user: true } } } } } } },
  });
  await audit("RECORD_PAYMENT", {
    entity: "Payment", entityId: payment.id,
    summary: `Captured ${inr(amount)} via ${method ?? "RAZORPAY"} → invoice ${inv.number}`,
    meta: { method, txnRef, receiptNo, invoiceNumber: inv.number },
  });
  if (detail) {
    const tpl = templates.paymentReceived(detail.student.user.name, inr(amount), receiptNo);
    await notify({ schoolId: sId, channel: "EMAIL", toEmail: detail.student.user.email, ...tpl, template: "PAYMENT_RECEIVED" });
    for (const g of detail.student.guardians) {
      await notify({ schoolId: sId, channel: "EMAIL", toEmail: g.guardian.user.email, ...tpl, template: "PAYMENT_RECEIVED" });
      await notify({ schoolId: sId, channel: "INAPP", toUserId: g.guardian.userId, ...tpl, template: "PAYMENT_RECEIVED" });
    }
  }

  return NextResponse.json({ ok: true, paymentId: payment.id, receiptNo });
}
