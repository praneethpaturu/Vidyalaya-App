import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { epfEcrText } from "@/lib/compliance";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ year: string; month: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const u = session.user as any;
  const { year, month } = await params;
  const text = await epfEcrText(u.schoolId, parseInt(month), parseInt(year));
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="ecr-${year}-${month}.txt"`,
    },
  });
}
