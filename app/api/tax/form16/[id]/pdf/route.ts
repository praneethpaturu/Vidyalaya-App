import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildForm16Pdf } from "@/lib/pdf";
import { form16For, fyOf } from "@/lib/compliance";

export const runtime = "nodejs";

const HR_ROLES = new Set(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let u;
  try { u = await requireUser(); }
  catch { return NextResponse.json({ error: "unauth" }, { status: 401 }); }
  const { id } = await params;
  const iss = await prisma.form16Issuance.findUnique({
    where: { id },
    include: { staff: { include: { user: true } } },
  });
  if (!iss) return NextResponse.json({ error: "not found" }, { status: 404 });
  // Tenancy + access: HR-class roles can fetch any staff member's Form 16; an
  // employee can only fetch their own.
  if (iss.staff.schoolId !== u.schoolId) return NextResponse.json({ error: "not found" }, { status: 404 });
  const isOwn = iss.staff.userId === u.id;
  if (!HR_ROLES.has(u.role) && !isOwn) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const fyStart = parseInt(iss.financialYear.split("-")[0]);
  const data = await form16For(u.schoolId, iss.staffId, fyStart);
  if (!data) return NextResponse.json({ error: "no payslips" }, { status: 404 });

  const school = await prisma.school.findUnique({ where: { id: u.schoolId } });
  const profile = await prisma.orgTaxProfile.findUnique({ where: { schoolId: u.schoolId } });

  const buf = await buildForm16Pdf({
    school: { name: school!.name, city: school!.city, state: school!.state, tan: profile?.tan ?? null, pan: profile?.pan ?? null },
    employee: { name: data.name, employeeId: data.employeeId, designation: data.designation, pan: data.pan },
    fyLabel: data.fyLabel,
    certificateNo: iss.certificateNo ?? `F16/${data.employeeId}/${data.fyLabel}`,
    issuedAt: iss.issuedAt,
    data: {
      monthsWorked: data.monthsWorked,
      totalGross: data.totalGross, totalBasic: data.totalBasic, totalHra: data.totalHra,
      totalDa: data.totalDa, totalSpecial: data.totalSpecial, totalTransport: data.totalTransport,
      totalEpf: data.totalEpf,
      standardDeduction: data.standardDeduction, hraExemption: data.hraExemption,
      chapter6A: data.chapter6A, homeLoanInterest: data.homeLoanInterest,
      taxableIncome: data.taxableIncome, baseTax: data.baseTax,
      rebate87A: data.rebate87A, surcharge: data.surcharge, cess: data.cess,
      totalTax: data.totalTax, tdsActuallyDeducted: data.tdsActuallyDeducted,
      refundOrPayable: data.refundOrPayable, regime: data.regime,
    },
  });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="form16-${data.employeeId}-${data.fyLabel}.pdf"`,
    },
  });
}
