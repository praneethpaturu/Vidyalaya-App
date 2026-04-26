"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify, templates } from "@/lib/notify";
import { inr } from "@/lib/utils";

export async function gradeSubmission(submissionId: string, assignmentId: string, formData: FormData) {
  const grade = Number(formData.get("grade") ?? 0);
  const updated = await prisma.submission.update({
    where: { id: submissionId },
    data: { status: "GRADED", grade, gradedAt: new Date(), feedback: "Auto-graded via demo flow." },
    include: {
      student: { include: { user: true, school: true } },
      assignment: true,
    },
  });
  await audit("GRADE_SUBMISSION", {
    entity: "Submission", entityId: submissionId,
    summary: `Graded "${updated.assignment.title}" — ${grade}/${updated.assignment.maxPoints} for ${updated.student.user.name}`,
    meta: { grade, max: updated.assignment.maxPoints },
  });
  const tpl = templates.assignmentGraded(updated.student.user.name, updated.assignment.title, grade, updated.assignment.maxPoints);
  await notify({
    schoolId: updated.student.schoolId, channel: "INAPP",
    toUserId: updated.student.userId, ...tpl, template: "ASSIGNMENT_GRADED",
  });
  await notify({
    schoolId: updated.student.schoolId, channel: "EMAIL",
    toEmail: updated.student.user.email, ...tpl, template: "ASSIGNMENT_GRADED",
  });
  const a = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (a) revalidatePath(`/classes/${a.classId}/work/${assignmentId}`);
}

export async function turnIn(submissionId: string, assignmentId: string, formData: FormData) {
  const action = formData.get("action");
  const session = await auth();
  const user = session!.user as any;
  const stu = await prisma.student.findUnique({ where: { userId: user.id } });
  if (!stu) return;
  if (action === "UNSUBMIT") {
    await prisma.submission.update({ where: { id: submissionId }, data: { status: "ASSIGNED", submittedAt: null } });
  } else if (submissionId) {
    await prisma.submission.update({ where: { id: submissionId }, data: { status: "TURNED_IN", submittedAt: new Date() } });
  } else {
    await prisma.submission.create({
      data: { assignmentId, studentId: stu.id, status: "TURNED_IN", submittedAt: new Date() },
    });
  }
  const a = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (a) revalidatePath(`/classes/${a.classId}/work/${assignmentId}`);
}

export async function createAnnouncement(classId: string, formData: FormData) {
  const session = await auth();
  const user = session!.user as any;
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;
  await prisma.announcement.create({
    data: { schoolId: user.schoolId, authorId: user.id, classId, title, body, audience: "CLASS" },
  });
  revalidatePath(`/classes/${classId}`);
}

export async function createAssignment(classId: string, formData: FormData) {
  const session = await auth();
  const user = session!.user as any;
  const staff = await prisma.staff.findUnique({ where: { userId: user.id } });
  if (!staff) return;
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const dueAt = formData.get("dueAt") ? new Date(String(formData.get("dueAt"))) : null;
  const subjectId = String(formData.get("subjectId") ?? "");
  const maxPoints = Number(formData.get("maxPoints") ?? 100);
  const a = await prisma.assignment.create({
    data: { classId, teacherId: staff.id, title, description, dueAt, subjectId: subjectId || null, maxPoints, status: "PUBLISHED" },
  });
  // Create empty submissions for all students in the class
  const students = await prisma.student.findMany({ where: { classId } });
  await prisma.submission.createMany({
    data: students.map((s) => ({ assignmentId: a.id, studentId: s.id, status: "ASSIGNED" })),
  });
  revalidatePath(`/classes/${classId}/classwork`);
  return a.id;
}
