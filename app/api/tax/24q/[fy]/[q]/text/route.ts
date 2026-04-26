import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { form24QFor } from "@/lib/compliance";

export const runtime = "nodejs";

// Stub of NSDL FVU input file format for Form 24Q Annexure II.
// Real format is fixed-width and complex (RPU schema). This text export is for
// human review and as a deliverable artefact during the demo.
export async function GET(_req: Request, { params }: { params: Promise<{ fy: string; q: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const u = session.user as any;
  const { fy, q } = await params;
  // URL examples we accept:
  //   fy = "2024-25" (FY label) or "2024" (just the start year)
  //   q  = "Q4" or "4"
  const fyStart = parseInt(String(fy).split("-")[0], 10);
  const qNum = parseInt(String(q).replace(/^[Qq]/, ""), 10);
  if (!Number.isFinite(fyStart) || ![1, 2, 3, 4].includes(qNum)) {
    return NextResponse.json(
      { error: "bad params", expected: "fy=2024-25 (or 2024), q=Q1..Q4 (or 1..4)" },
      { status: 400 },
    );
  }
  const quarter = qNum as 1 | 2 | 3 | 4;

  const summary = await form24QFor(u.schoolId, fyStart, quarter);
  const lines: string[] = [];
  lines.push(`# Vidyalaya — Form 24Q Annexure II`);
  lines.push(`# School ID: ${u.schoolId}`);
  lines.push(`# FY ${fyStart}-${String((fyStart + 1) % 100).padStart(2, "0")} · Q${quarter}`);
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push(``);
  lines.push([
    "Sl", "EmployeeId", "PAN", "Name", "Designation", "Months",
    "GrossPaise", "EpfPaise", "EsiPaise", "TdsPaise",
  ].join("|"));
  summary.rows.forEach((r, i) => {
    lines.push([
      i + 1,
      r.employeeId, r.pan ?? "PANNOTAVBL",
      r.name.replace(/\|/g, " "),
      r.designation,
      r.monthsCovered,
      r.totalGross, r.totalEpf, r.totalEsi, r.totalTds,
    ].join("|"));
  });
  lines.push(``);
  lines.push(`# Totals: ${summary.totalEmployees} employees, gross ${summary.totalGross}, tds ${summary.totalTds}`);

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="form24q-fy${fyStart}-q${quarter}.txt"`,
    },
  });
}
