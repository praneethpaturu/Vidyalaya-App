import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const u = session.user as any;
  const { submissionId, assignmentId, fileIds, action } = await req.json();
  const stu = await prisma.student.findUnique({ where: { userId: u.id } });
  if (!stu) return NextResponse.json({ error: "not student" }, { status: 403 });

  if (action === "UNSUBMIT") {
    await prisma.submission.update({ where: { id: submissionId }, data: { status: "ASSIGNED", submittedAt: null } });
    await audit("UNSUBMIT", { entity: "Submission", entityId: submissionId, summary: "Student unsubmitted work" });
    return NextResponse.json({ ok: true });
  }

  // Build attachments JSON from FileAsset rows
  let attachments: any[] = [];
  if (Array.isArray(fileIds) && fileIds.length > 0) {
    const files = await prisma.fileAsset.findMany({ where: { id: { in: fileIds }, schoolId: u.schoolId } });
    attachments = files.map((f) => ({ id: f.id, url: f.url, filename: f.filename, mimeType: f.mimeType, size: f.size }));
  }

  let sub;
  if (submissionId) {
    sub = await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "TURNED_IN", submittedAt: new Date(), attachments: JSON.stringify(attachments) },
    });
  } else {
    sub = await prisma.submission.create({
      data: { assignmentId, studentId: stu.id, status: "TURNED_IN", submittedAt: new Date(), attachments: JSON.stringify(attachments) },
    });
  }
  await audit("TURN_IN", {
    entity: "Submission", entityId: sub.id,
    summary: `Turned in work with ${attachments.length} attachment${attachments.length === 1 ? "" : "s"}`,
    meta: { fileIds, attachmentCount: attachments.length },
  });
  return NextResponse.json({ ok: true });
}
