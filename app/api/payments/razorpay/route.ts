import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { payments } from "@/lib/integrations";

export const runtime = "nodejs";

const FINANCE_ROLES = new Set(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);

/** Create a Razorpay order for an Invoice. Browser then opens checkout. */
export async function POST(req: Request) {
  let u;
  try { u = await requireUser(); }
  catch { return NextResponse.json({ error: "unauth" }, { status: 401 }); }
  const { invoiceId } = await req.json();
  const inv = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { student: { include: { guardians: { include: { guardian: true } } } } },
  });
  if (!inv || inv.schoolId !== u.schoolId) return NextResponse.json({ error: "not found" }, { status: 404 });
  // The student or their guardians may pay; finance staff may also initiate.
  const isOwn = inv.student.userId === u.id
    || inv.student.guardians.some((gs) => gs.guardian.userId === u.id);
  if (!FINANCE_ROLES.has(u.role) && !isOwn) return NextResponse.json({ error: "forbidden" }, { status: 403 });
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
