import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { notify, templates } from "@/lib/notify";
import { inr } from "@/lib/utils";

export const runtime = "nodejs";

// Client-side signature verification path. Razorpay's Checkout SDK fires
// `handler` on success with razorpay_payment_id, razorpay_order_id, and
// razorpay_signature. Verifying that signature here (HMAC-SHA256 of
// `${order_id}|${payment_id}` keyed with RAZORPAY_KEY_SECRET) proves the
// payment came from Razorpay without needing a webhook.
//
// Idempotent: if a Payment for this txnRef already exists (e.g. webhook
// fired first), we reuse it instead of creating a duplicate.

const FINANCE_ROLES = new Set(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);

export async function POST(req: Request) {
  let me;
  try { me = await requireUser(); }
  catch { return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 }); }

  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "bad-json" }, { status: 400 }); }

  const invoiceId = String(body?.invoiceId ?? "");
  const orderId   = String(body?.razorpayOrderId ?? "");
  const paymentId = String(body?.razorpayPaymentId ?? "");
  const signature = String(body?.razorpaySignature ?? "");
  if (!invoiceId || !orderId || !paymentId || !signature) {
    return NextResponse.json({ ok: false, error: "missing-fields" }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    // Defensive — refuse to mark anything paid if we can't actually
    // verify. Better to leave the invoice as ISSUED than to fabricate.
    return NextResponse.json({ ok: false, error: "razorpay-not-configured" }, { status: 500 });
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  let valid = false;
  try {
    valid = crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    valid = false;
  }
  if (!valid) return NextResponse.json({ ok: false, error: "bad-signature" }, { status: 401 });

  const inv = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { student: { include: { user: true, guardians: { include: { guardian: { include: { user: true } } } } } } },
  });
  if (!inv) return NextResponse.json({ ok: false, error: "no-invoice" }, { status: 404 });
  if (inv.schoolId !== me.schoolId) return NextResponse.json({ ok: false, error: "no-invoice" }, { status: 404 });
  const isOwn = inv.student.userId === me.id
    || inv.student.guardians.some((gs) => gs.guardian.userId === me.id);
  if (!FINANCE_ROLES.has(me.role) && !isOwn) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  // Idempotency: if a Payment with this txnRef exists, return it; otherwise
  // create. We use Razorpay's payment_id as the txnRef so webhook + verify
  // can never both create.
  const existing = await prisma.payment.findFirst({ where: { schoolId: me.schoolId, txnRef: paymentId } });
  if (existing) {
    return NextResponse.json({ ok: true, idempotent: true, paymentId: existing.id, receiptNo: existing.receiptNo });
  }

  // Fetch the order from Razorpay to get the authoritative captured amount,
  // so we don't trust the browser's claim about how much was paid.
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${secret}`).toString("base64");
  const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${orderId}/payments`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  let captured: number | null = null;
  if (orderRes.ok) {
    const data: any = await orderRes.json();
    const payment = data?.items?.find((p: any) => p.id === paymentId);
    if (payment && payment.status === "captured") captured = payment.amount as number;
  }
  if (captured == null) {
    return NextResponse.json({ ok: false, error: "not-captured" }, { status: 409 });
  }

  // Receipt sequence
  const last = await prisma.payment.findFirst({
    where: { schoolId: me.schoolId },
    orderBy: { receiptNo: "desc" },
  });
  const lastNum = last?.receiptNo?.match(/(\d+)$/)?.[1] ?? "0";
  const next = String(parseInt(lastNum) + 1).padStart(4, "0");
  const receiptNo = `RCP-${new Date().getFullYear()}-${next}`;

  const payment = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.create({
      data: {
        schoolId: me.schoolId,
        invoiceId: inv.id,
        receiptNo,
        amount: captured!,
        method: "RAZORPAY",
        status: "SUCCESS",
        txnRef: paymentId,
      },
    });
    const newPaid = inv.amountPaid + captured!;
    const newStatus = newPaid >= inv.total ? "PAID" : newPaid > 0 ? "PARTIAL" : "ISSUED";
    await tx.invoice.update({
      where: { id: inv.id },
      data: { amountPaid: newPaid, status: newStatus },
    });
    return p;
  });

  await audit("RECORD_PAYMENT", {
    entity: "Payment", entityId: payment.id,
    summary: `Captured ${inr(captured)} via Razorpay → invoice ${inv.number}`,
    meta: { method: "RAZORPAY", txnRef: paymentId, orderId, receiptNo, invoiceNumber: inv.number },
  }).catch(() => {});

  // Notify student + guardians (best-effort).
  try {
    const tpl = templates.paymentReceived(inv.student.user.name, inr(captured), receiptNo);
    await notify({ schoolId: me.schoolId, channel: "EMAIL", toEmail: inv.student.user.email, ...tpl, template: "PAYMENT_RECEIVED" });
    for (const g of inv.student.guardians) {
      await notify({ schoolId: me.schoolId, channel: "EMAIL", toEmail: g.guardian.user.email, ...tpl, template: "PAYMENT_RECEIVED" });
      await notify({ schoolId: me.schoolId, channel: "INAPP", toUserId: g.guardian.userId, ...tpl, template: "PAYMENT_RECEIVED" });
    }
  } catch {}

  return NextResponse.json({ ok: true, paymentId: payment.id, receiptNo, amountPaid: captured });
}
