import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildPayslipPdf } from "@/lib/pdf";

export const runtime = "nodejs";

const STAFF_ROLES = new Set(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let u;
  try { u = await requireUser(); }
  catch { return NextResponse.json({ error: "unauth" }, { status: 401 }); }
  const { id } = await params;
  const slip = await prisma.payslip.findUnique({
    where: { id },
    include: { staff: { include: { user: true } }, school: true },
  });
  if (!slip || slip.schoolId !== u.schoolId) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }
  // Staff get all; the staff member themselves can view their own slip
  const isOwn = slip.staff.userId === u.id;
  if (!STAFF_ROLES.has(u.role) && !isOwn) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const buf = await buildPayslipPdf({
    school: { name: slip.school.name, city: slip.school.city, state: slip.school.state },
    staff: {
      name: slip.staff.user.name,
      employeeId: slip.staff.employeeId,
      designation: slip.staff.designation,
      pan: slip.staff.pan,
    },
    payslip: {
      month: slip.month, year: slip.year,
      workedDays: slip.workedDays, lopDays: slip.lopDays,
      basic: slip.basic, hra: slip.hra, da: slip.da,
      special: slip.special, transport: slip.transport, gross: slip.gross,
      pf: slip.pf, esi: slip.esi, tds: slip.tds,
      otherDeductions: slip.otherDeductions, totalDeductions: slip.totalDeductions,
      net: slip.net, status: slip.status, paidAt: slip.paidAt,
    },
  });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="payslip-${slip.staff.employeeId}-${slip.year}-${String(slip.month).padStart(2,"0")}.pdf"`,
    },
  });
}
