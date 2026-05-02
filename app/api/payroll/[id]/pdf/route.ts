import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildPayslipPdf } from "@/lib/pdf";

export const runtime = "nodejs";

const HR_ROLES = new Set(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let u;
  try { u = await requireUser(); }
  catch { return NextResponse.json({ error: "unauth" }, { status: 401 }); }
  const { id } = await params;
  const p = await prisma.payslip.findUnique({
    where: { id },
    include: { staff: { include: { user: true } }, school: true },
  });
  if (!p) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (p.staff.schoolId !== u.schoolId) return NextResponse.json({ error: "not found" }, { status: 404 });
  const isOwn = p.staff.userId === u.id;
  if (!HR_ROLES.has(u.role) && !isOwn) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const buf = await buildPayslipPdf({
    school: { name: p.school.name, city: p.school.city, state: p.school.state },
    staff: { name: p.staff.user.name, employeeId: p.staff.employeeId, designation: p.staff.designation, pan: p.staff.pan },
    payslip: {
      month: p.month, year: p.year, workedDays: p.workedDays, lopDays: p.lopDays,
      basic: p.basic, hra: p.hra, da: p.da, special: p.special, transport: p.transport, gross: p.gross,
      pf: p.pf, esi: p.esi, tds: p.tds, otherDeductions: p.otherDeductions, totalDeductions: p.totalDeductions,
      net: p.net, status: p.status, paidAt: p.paidAt,
    },
  });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="payslip-${p.staff.employeeId}-${p.month}-${p.year}.pdf"`,
    },
  });
}
