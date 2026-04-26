import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readLocal } from "@/lib/upload";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ schoolId: string; yyyymm: string; name: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const u = session.user as any;
  const { schoolId, yyyymm, name } = await params;
  // Tenancy guard — only the owning school can fetch
  if (schoolId !== u.schoolId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const { buf } = await readLocal(`${schoolId}/${yyyymm}/${name}`);
    const ext = name.split(".").pop()?.toLowerCase();
    const mime =
      ext === "pdf" ? "application/pdf" :
      ext === "png" ? "image/png" :
      ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
      ext === "webp" ? "image/webp" :
      "application/octet-stream";
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `inline; filename="${name}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
