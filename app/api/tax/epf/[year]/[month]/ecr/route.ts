import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { epfEcrText } from "@/lib/compliance";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ year: string; month: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const u = session.user as any;
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
