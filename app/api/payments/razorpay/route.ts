import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { payments } from "@/lib/integrations";

export const runtime = "nodejs";

/** Create a Razorpay order for an Invoice. Browser then opens checkout. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const u = session.user as any;
  const { invoiceId } = await req.json();
  const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!inv || inv.schoolId !== u.schoolId) return NextResponse.json({ error: "not found" }, { status: 404 });
  const due = inv.total - inv.amountPaid;
  if (due <= 0) return NextResponse.json({ error: "no balance due" }, { status: 400 });

  const order = await payments.createOrder({
    amountPaise: due,
    receiptId: inv.number,
    notes: { invoiceId: inv.id, schoolId: inv.schoolId },
  });

  return NextResponse.json({
    ok: order.ok,
    provider: order.provider,
    orderId: order.orderId,
    amountPaise: order.amountPaise,
    keyId: order.keyId,    // for browser SDK
    error: order.error,
  });
}
