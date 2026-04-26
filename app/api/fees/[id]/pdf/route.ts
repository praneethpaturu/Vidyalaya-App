import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildInvoicePdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { id } = await params;
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: { student: { include: { user: true, class: true } }, lines: true, school: true },
  });
  if (!inv) return NextResponse.json({ error: "not found" }, { status: 404 });

  const buf = await buildInvoicePdf({
    school: { name: inv.school.name, city: inv.school.city, state: inv.school.state, phone: inv.school.phone, email: inv.school.email },
    invoice: {
      number: inv.number, issueDate: inv.issueDate, dueDate: inv.dueDate,
      subtotal: inv.subtotal, total: inv.total, amountPaid: inv.amountPaid, status: inv.status,
      lines: inv.lines.map((l) => ({ description: l.description, amount: l.amount })),
    },
    student: { name: inv.student.user.name, admissionNo: inv.student.admissionNo, class: inv.student.class?.name ?? null, rollNo: inv.student.rollNo },
  });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${inv.number}.pdf"`,
    },
  });
}
