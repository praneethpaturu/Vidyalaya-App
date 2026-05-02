import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildReceiptPdf } from "@/lib/pdf";

export const runtime = "nodejs";

const FINANCE_ROLES = new Set(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let u;
  try { u = await requireUser(); }
  catch { return NextResponse.json({ error: "unauth" }, { status: 401 }); }
  const { id } = await params;
  const p = await prisma.payment.findUnique({
    where: { id },
    include: {
      school: true,
      invoice: {
        include: {
          student: { include: { user: true, class: true, guardians: { include: { guardian: true } } } },
        },
      },
    },
  });
  if (!p || !p.invoice) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (p.schoolId !== u.schoolId) return NextResponse.json({ error: "not found" }, { status: 404 });
  // Students see their own; their guardians see them; finance roles see any.
  const isOwn = p.invoice.student.userId === u.id
    || p.invoice.student.guardians.some((gs) => gs.guardian.userId === u.id);
  if (!FINANCE_ROLES.has(u.role) && !isOwn) return NextResponse.json({ error: "forbidden" }, { status: 403 });

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
