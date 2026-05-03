import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildReceiptPdf } from "@/lib/pdf";

export const runtime = "nodejs";

const STAFF_ROLES = new Set(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let u;
  try { u = await requireUser(); }
  catch { return NextResponse.json({ error: "unauth" }, { status: 401 }); }
  const { id } = await params;

  const pay = await prisma.payment.findUnique({
    where: { id },
    include: {
      school: true,
      invoice: {
        include: {
          student: {
            include: {
              user: true, class: true,
              guardians: { include: { guardian: true } },
            },
          },
        },
      },
    },
  });
  if (!pay || pay.schoolId !== u.schoolId) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  const stu = pay.invoice?.student;
  if (!stu) return NextResponse.json({ error: "no-student" }, { status: 404 });

  const isOwn = stu.userId === u.id ||
    stu.guardians.some((g: any) => g.guardian.userId === u.id);
  if (!STAFF_ROLES.has(u.role) && !isOwn) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const buf = await buildReceiptPdf({
    school: { name: pay.school.name, city: pay.school.city, state: pay.school.state },
    payment: {
      receiptNo: pay.receiptNo, amount: pay.amount, method: pay.method,
      txnRef: pay.txnRef, paidAt: pay.paidAt,
    },
    student: { name: stu.user.name, admissionNo: stu.admissionNo, class: stu.class?.name ?? null },
    invoice: pay.invoice ? { number: pay.invoice.number } : null,
  });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="receipt-${pay.receiptNo}.pdf"`,
    },
  });
}
