import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL"]);
  const fy = new URL(req.url).searchParams.get("fy");
  if (!fy) return NextResponse.json({ error: "missing-fy" }, { status: 400 });
  const r = await prisma.uDISEReport.findUnique({
    where: { schoolId_academicYear: { schoolId: u.schoolId, academicYear: fy } },
  });
  if (!r) return NextResponse.json({ error: "not-found" }, { status: 404 });

  return new NextResponse(r.payload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="udise-${fy.replace(/\//g, "-")}.json"`,
    },
  });
}
