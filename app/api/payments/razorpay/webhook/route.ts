import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { payments } from "@/lib/integrations";
import { capture } from "@/lib/observability";

export const runtime = "nodejs";

/** Razorpay webhook — payment.captured triggers Invoice → PAID. Idempotent. */
export async function POST(req: Request) {
  const sig = req.headers.get("x-razorpay-signature");
  const raw = await req.text();
  if (!sig || !payments.verifySignature(raw, sig)) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }
  let body: any;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  if (body.event === "payment.captured") {
    const p = body.payload?.payment?.entity;
    const invoiceId = p?.notes?.invoiceId;
    const schoolId  = p?.notes?.schoolId;
    if (!invoiceId || !schoolId) return NextResponse.json({ ok: true, ignored: "no invoiceId in notes" });
    const receiptNo = `RZP-${p.id}`;
    try {
      // Idempotency guard: Razorpay can re-deliver the same webhook. The
      // (schoolId, receiptNo) unique constraint covers the Payment row,
      // but we short-circuit so the Invoice.amountPaid increment isn't
      // re-applied on a redelivery.
      const dup = await prisma.payment.findFirst({
        where: { schoolId, receiptNo },
        select: { id: true },
      });
      if (dup) return NextResponse.json({ ok: true, idempotent: true });

      await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.findUnique({ where: { id: invoiceId } });
        if (!inv || inv.schoolId !== schoolId) throw new Error("invoice mismatch");
        // Re-check inside the transaction to close the race window.
        const dupTx = await tx.payment.findFirst({
          where: { schoolId, receiptNo }, select: { id: true },
        });
        if (dupTx) return;
        await tx.payment.create({
          data: {
            schoolId,
            invoiceId: inv.id,
            receiptNo,
            amount: p.amount,
            method: "RAZORPAY",
            status: "SUCCESS",
            txnRef: p.id,
          },
        });
        await tx.invoice.update({
          where: { id: inv.id },
          data: {
            amountPaid: inv.amountPaid + p.amount,
            status: inv.amountPaid + p.amount >= inv.total ? "PAID" : "PARTIAL",
          },
        });
      });
      return NextResponse.json({ ok: true });
    } catch (err: any) {
      // A simultaneous redelivery can still raise a unique-violation;
      // that's a benign idempotent outcome — don't 500 the caller.
      if (err?.code === "P2002") return NextResponse.json({ ok: true, idempotent: true });
      await capture(err, { schoolId, route: "razorpay-webhook" });
      return NextResponse.json({ error: "internal" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, ignored: body.event });
}
