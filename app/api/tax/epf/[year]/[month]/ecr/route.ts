import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { epfEcrText } from "@/lib/compliance";

export const runtime = "nodejs";

const ALLOWED = ["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"];

export async function GET(_req: Request, { params }: { params: Promise<{ year: string; month: string }> }) {
  let u;
  try { u = await requireRole(ALLOWED); }
  catch (e: any) {
    return NextResponse.json({ error: e?.message === "UNAUTHORIZED" ? "unauth" : "forbidden" }, { status: e?.message === "UNAUTHORIZED" ? 401 : 403 });
  }
  const { year, month } = await params;
  const yNum = parseInt(String(year), 10);
  const mNum = parseInt(String(month), 10);
  if (!Number.isFinite(yNum) || !Number.isFinite(mNum) || mNum < 1 || mNum > 12) {
    return NextResponse.json({ error: "bad params", expected: "year=YYYY, month=1..12" }, { status: 400 });
  }
  const text = await epfEcrText(u.schoolId, mNum, yNum);
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="ecr-${year}-${month}.txt"`,
    },
  });
}
