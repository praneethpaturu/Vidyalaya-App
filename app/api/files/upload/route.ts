import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveLocal } from "@/lib/upload";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const u = session.user as any;

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const ownerEntity = String(form.get("ownerEntity") ?? "");
  const ownerId = String(form.get("ownerId") ?? "");
  const kind = String(form.get("kind") ?? "OTHER");
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

  try {
    const stored = await saveLocal(u.schoolId, file);
    const row = await prisma.fileAsset.create({
      data: {
        schoolId: u.schoolId,
        uploaderId: u.id,
        filename: stored.filename,
        storagePath: stored.storagePath,
        url: stored.url,
        mimeType: stored.mimeType,
        size: stored.size,
        kind,
        ownerEntity: ownerEntity || undefined,
        ownerId: ownerId || undefined,
      },
    });
    await audit("UPLOAD_FILE", {
      entity: "FileAsset", entityId: row.id,
      summary: `Uploaded ${stored.filename} (${(stored.size / 1024).toFixed(1)} KB)`,
      meta: { kind, ownerEntity, ownerId, mime: stored.mimeType },
    });
    return NextResponse.json({ ok: true, file: row });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
