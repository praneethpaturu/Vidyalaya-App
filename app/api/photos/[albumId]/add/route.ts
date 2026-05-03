import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ albumId: string }> }) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const { albumId } = await params;
  const body = await req.json().catch(() => ({}));
  const url = String(body?.url ?? "").trim();
  if (!url) return NextResponse.json({ ok: false, error: "no-url" }, { status: 400 });

  const album = await prisma.photoAlbum.findFirst({ where: { id: albumId, schoolId: u.schoolId } });
  if (!album) return NextResponse.json({ ok: false, error: "no-album" }, { status: 404 });

  const photo = await prisma.photo.create({
    data: {
      albumId,
      url,
      caption: String(body?.caption ?? "") || null,
    },
  });
  return NextResponse.json({ ok: true, photoId: photo.id });
}
