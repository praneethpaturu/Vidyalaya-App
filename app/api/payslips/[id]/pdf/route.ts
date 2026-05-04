import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildPayslipPdf } from "@/lib/pdf";

export const runtime = "nodejs";

// EPF wage ceiling (₹15,000/month) — same value used in lib/payroll-calc.ts.
const EPF_WAGE_CEILING = 15_000_00;
const ESI_GROSS_CEILING = 21_000_00;

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

  // ----- FY-to-date aggregates so the payslip can show a YTD column -----
  const fyStart = slip.month >= 4 ? slip.year : slip.year - 1;
  const ytdSlips = await prisma.payslip.findMany({
    where: {
      schoolId: slip.schoolId,
      staffId: slip.staffId,
      OR: [
        { year: fyStart, month: { in: [4, 5, 6, 7, 8, 9, 10, 11, 12] } },
        { year: fyStart + 1, month: { in: [1, 2, 3] } },
      ],
      // include the current slip in totals up to and including this period
      AND: [{ OR: [{ year: { lt: slip.year } }, { year: slip.year, month: { lte: slip.month } }] }],
    },
    select: {
      basic: true, hra: true, da: true, special: true, transport: true, gross: true,
      pf: true, esi: true, tds: true, pt: true, otherDeductions: true, totalDeductions: true, net: true,
    },
  });
  const ytd = ytdSlips.reduce(
    (a, s) => ({
      basic: a.basic + s.basic, hra: a.hra + s.hra, da: a.da + s.da,
      special: a.special + s.special, transport: a.transport + s.transport, gross: a.gross + s.gross,
      pf: a.pf + s.pf, esi: a.esi + s.esi, tds: a.tds + s.tds, pt: a.pt + s.pt,
      otherDeductions: a.otherDeductions + s.otherDeductions,
      totalDeductions: a.totalDeductions + s.totalDeductions,
      net: a.net + s.net,
    }),
    { basic: 0, hra: 0, da: 0, special: 0, transport: 0, gross: 0, pf: 0, esi: 0, tds: 0, pt: 0, otherDeductions: 0, totalDeductions: 0, net: 0 },
  );

  // ----- Employer contributions (informational) -----
  const epfWages = Math.min(slip.basic + slip.da, EPF_WAGE_CEILING);
  const employer = {
    pf:   Math.round(epfWages * 3.67 / 100),
    eps:  Math.round(epfWages * 8.33 / 100),
    edli: Math.round(epfWages * 0.5 / 100),
    esi:  slip.gross <= ESI_GROSS_CEILING ? Math.round(slip.gross * 3.25 / 100) : 0,
  };

  const buf = await buildPayslipPdf({
    school: { name: slip.school.name, city: slip.school.city, state: slip.school.state },
    staff: {
      name: slip.staff.user.name,
      employeeId: slip.staff.employeeId,
      designation: slip.staff.designation,
      pan: slip.staff.pan,
      doj: slip.staff.joiningDate,
    },
    payslip: {
      month: slip.month, year: slip.year,
      workedDays: slip.workedDays, lopDays: slip.lopDays,
      basic: slip.basic, hra: slip.hra, da: slip.da,
      special: slip.special, transport: slip.transport, gross: slip.gross,
      pf: slip.pf, esi: slip.esi, tds: slip.tds, pt: slip.pt,
      otherDeductions: slip.otherDeductions, totalDeductions: slip.totalDeductions,
      net: slip.net, status: slip.status, paidAt: slip.paidAt,
      ytd,
      employer,
    },
  });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="payslip-${slip.staff.employeeId}-${slip.year}-${String(slip.month).padStart(2,"0")}.pdf"`,
    },
  });
}
