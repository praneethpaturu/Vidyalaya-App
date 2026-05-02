import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { form16AFor } from "@/lib/compliance";
import { buildForm16APdf } from "@/lib/pdf";

export const runtime = "nodejs";

const ALLOWED = ["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ vendorId: string; fy: string; q: string }> },
) {
  let u;
  try { u = await requireRole(ALLOWED); }
  catch (e: any) {
    return NextResponse.json({ error: e?.message === "UNAUTHORIZED" ? "unauth" : "forbidden" }, { status: e?.message === "UNAUTHORIZED" ? 401 : 403 });
  }
  const { vendorId, fy, q } = await params;
  const fyStart = parseInt(String(fy).split("-")[0], 10);
  const qNum = parseInt(String(q).replace(/^[Qq]/, ""), 10);
  if (!Number.isFinite(fyStart) || ![1, 2, 3, 4].includes(qNum)) {
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  }
  const quarter = qNum as 1 | 2 | 3 | 4;

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || vendor.schoolId !== u.schoolId) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data = await form16AFor(u.schoolId, vendorId, fyStart, quarter);
  if (!data) return NextResponse.json({ error: "no deductions" }, { status: 404 });

  const school = await prisma.school.findUnique({ where: { id: u.schoolId } });
  const profile = await prisma.orgTaxProfile.findUnique({ where: { schoolId: u.schoolId } });

  const rows = data.bySection.flatMap((s) =>
    s.deductions.map((d) => ({
      paidAt: d.paidAt,
      section: s.section,
      nature: s.natureOfPayment ?? s.section,
      gross: d.grossPaise,
      rate: d.tdsRate,
      tds: d.tdsPaise,
      net: d.grossPaise - d.tdsPaise,
    })),
  );

  const certificateNo = `F16A/${vendor.name.replace(/\s+/g, "").slice(0, 6).toUpperCase()}/${data.fyLabel}/Q${quarter}`;

  const buf = await buildForm16APdf({
    school: {
      name: school!.name, city: school!.city, state: school!.state,
      tan: profile?.tan ?? null, pan: profile?.pan ?? null,
    },
    vendor: {
      name: vendor.name, pan: vendor.pan, gstin: vendor.gstin,
    },
    certificateNo,
    fyLabel: data.fyLabel,
    quarter: data.quarter,
    rows,
  });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="form16a-${vendor.name.replace(/\s+/g, "_")}-${data.fyLabel}-q${quarter}.pdf"`,
    },
  });
}
