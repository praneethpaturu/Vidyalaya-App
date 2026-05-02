import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { form26QFor } from "@/lib/compliance";

export const runtime = "nodejs";

const ALLOWED = ["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"];

// Simplified pipe-separated export of Form 26Q (vendor TDS) for the FVU
// flow's human review step. Real RPU input is fixed-width and complex.
// URL: /api/tax/26q/2024-25/Q4/text  or  /api/tax/26q/2024/4/text
export async function GET(_req: Request, { params }: { params: Promise<{ fy: string; q: string }> }) {
  let u;
  try { u = await requireRole(ALLOWED); }
  catch (e: any) {
    return NextResponse.json({ error: e?.message === "UNAUTHORIZED" ? "unauth" : "forbidden" }, { status: e?.message === "UNAUTHORIZED" ? 401 : 403 });
  }
  const { fy, q } = await params;
  const fyStart = parseInt(String(fy).split("-")[0], 10);
  const qNum = parseInt(String(q).replace(/^[Qq]/, ""), 10);
  if (!Number.isFinite(fyStart) || ![1, 2, 3, 4].includes(qNum)) {
    return NextResponse.json(
      { error: "bad params", expected: "fy=2024-25 (or 2024), q=Q1..Q4 (or 1..4)" },
      { status: 400 },
    );
  }
  const quarter = qNum as 1 | 2 | 3 | 4;
  const summary = await form26QFor(u.schoolId, fyStart, quarter);
  const lines: string[] = [];
  lines.push(`# Vidyalaya — Form 26Q (Vendor TDS)`);
  lines.push(`# School ID: ${u.schoolId}`);
  lines.push(`# FY ${fyStart}-${String((fyStart + 1) % 100).padStart(2, "0")} · Q${quarter}`);
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push(``);
  lines.push([
    "Sl", "VendorName", "PAN", "Section", "NatureOfPayment",
    "DeductionsCount", "PanFurnished", "GrossPaise", "TdsPaise",
  ].join("|"));
  summary.rows.forEach((r, i) => {
    lines.push([
      i + 1,
      r.vendorName.replace(/\|/g, " "),
      r.pan ?? "PANNOTAVBL",
      r.section,
      (r.natureOfPayment ?? "").replace(/\|/g, " "),
      r.deductionCount,
      r.panFurnished ? "Y" : "N",
      r.totalGrossPaise,
      r.totalTdsPaise,
    ].join("|"));
  });
  lines.push(``);
  lines.push(`# Totals: ${summary.totalVendors} vendors, gross ${summary.totalGross}, tds ${summary.totalTds}`);

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="form26q-fy${fyStart}-q${quarter}.txt"`,
    },
  });
}
