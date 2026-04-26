"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function setTimetableSlot(fd: FormData) {
  const session = await auth();
  const u = session!.user as any;
  const classId = String(fd.get("classId"));
  const dayOfWeek = Number(fd.get("dayOfWeek"));
  const period = Number(fd.get("period"));
  const subjectId = String(fd.get("subjectId") ?? "") || null;
  const teacherId = subjectId
    ? (await prisma.subject.findUnique({ where: { id: subjectId } }))?.teacherId ?? null
    : null;
  const startTime = String(fd.get("startTime") ?? "08:00");
  const endTime = String(fd.get("endTime") ?? "08:45");
  const room = String(fd.get("room") ?? "") || null;

  if (!subjectId) {
    await prisma.timetableEntry.deleteMany({ where: { classId, dayOfWeek, period } });
  } else {
    await prisma.timetableEntry.upsert({
      where: { classId_dayOfWeek_period: { classId, dayOfWeek, period } },
      update: { subjectId, teacherId, startTime, endTime, room },
      create: { schoolId: u.schoolId, classId, dayOfWeek, period, subjectId, teacherId, startTime, endTime, room },
    });
  }
  await audit("SET_TIMETABLE_SLOT", { entity: "TimetableEntry", summary: `Updated period ${period} day ${dayOfWeek}` });
  revalidatePath(`/timetable/edit/${classId}`);
  revalidatePath(`/timetable`);
}
