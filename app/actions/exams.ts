"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function createExam(fd: FormData) {
  const session = await auth();
  const u = session!.user as any;
  const classId = String(fd.get("classId"));
  const name = String(fd.get("name"));
  const type = String(fd.get("type"));
  const startDate = new Date(String(fd.get("startDate")));
  const endDate = new Date(String(fd.get("endDate")));
  const maxPerSubject = Number(fd.get("maxPerSubject") ?? 100);
  const passingPct = Number(fd.get("passingPct") ?? 35);
  const subjectIds = fd.getAll("subjectIds").map(String);

  const exam = await prisma.exam.create({
    data: {
      schoolId: u.schoolId, classId, name, type, startDate, endDate,
      maxPerSubject, passingPct, status: "PLANNED",
      subjects: { create: subjectIds.map((sid) => ({ subjectId: sid, maxMarks: maxPerSubject })) },
    },
  });
  await audit("CREATE_EXAM", { entity: "Exam", entityId: exam.id, summary: `Created exam "${name}" with ${subjectIds.length} subjects` });
  redirect(`/exams/${exam.id}?toast=Exam+created`);
}

export async function saveMarks(examSubjectId: string, fd: FormData) {
  const session = await auth();
  const u = session!.user as any;
  const examSubject = await prisma.examSubject.findUnique({ where: { id: examSubjectId }, include: { exam: true } });
  if (!examSubject) return;

  const studentIds = fd.getAll("studentId").map(String);
  let saved = 0;
  for (const studentId of studentIds) {
    const raw = fd.get(`marks_${studentId}`);
    const absent = fd.get(`absent_${studentId}`) === "on";
    if (absent) {
      await prisma.examMark.upsert({
        where: { examSubjectId_studentId: { examSubjectId, studentId } },
        update: { absent: true, marksObtained: 0, enteredById: u.id },
        create: { examId: examSubject.examId, examSubjectId, studentId, marksObtained: 0, absent: true, enteredById: u.id },
      });
      saved++;
    } else if (raw !== null && String(raw).trim() !== "") {
      const m = Math.max(0, Math.min(examSubject.maxMarks, Number(raw)));
      await prisma.examMark.upsert({
        where: { examSubjectId_studentId: { examSubjectId, studentId } },
        update: { marksObtained: m, absent: false, enteredById: u.id },
        create: { examId: examSubject.examId, examSubjectId, studentId, marksObtained: m, absent: false, enteredById: u.id },
      });
      saved++;
    }
  }
  await audit("SAVE_EXAM_MARKS", { entity: "ExamSubject", entityId: examSubjectId, summary: `Saved marks for ${saved} students` });
  revalidatePath(`/exams/${examSubject.examId}`);
}

export async function publishExam(examId: string) {
  const session = await auth();
  await prisma.exam.update({ where: { id: examId }, data: { status: "PUBLISHED" } });
  await audit("PUBLISH_EXAM", { entity: "Exam", entityId: examId, summary: "Exam results published" });
  revalidatePath(`/exams/${examId}`);
}
