import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildReceiptPdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { id } = await params;
  const p = await prisma.payment.findUnique({
    where: { id },
    include: { school: true, invoice: { include: { student: { include: { user: true, class: true } } } } },
  });
  if (!p || !p.invoice) return NextResponse.json({ error: "not found" }, { status: 404 });

  const buf = await buildReceiptPdf({
    school: { name: p.school.name, city: p.school.city, state: p.school.state },
    payment: { receiptNo: p.receiptNo, amount: p.amount, method: p.method, txnRef: p.txnRef, paidAt: p.paidAt },
    student: { name: p.invoice.student.user.name, admissionNo: p.invoice.student.admissionNo, class: p.invoice.student.class?.name ?? null },
    invoice: { number: p.invoice.number },
  });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="receipt-${p.receiptNo}.pdf"`,
    },
  });
}
