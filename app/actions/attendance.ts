"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function markAttendance(classId: string, studentId: string, dateIso: string, formData: FormData) {
  const session = await auth();
  const user = session!.user as any;
  const status = String(formData.get("status") ?? "PRESENT");
  const date = new Date(dateIso);
  await prisma.classAttendance.upsert({
    where: { classId_studentId_date: { classId, studentId, date } },
    update: { status, markedById: user.id },
    create: { classId, studentId, date, status, markedById: user.id },
  });
  revalidatePath(`/attendance/${classId}`);
}

// Staff attendance — clock in / clock out
export async function staffClockIn() {
  const session = await auth();
  const user = session!.user as any;
  const staff = await prisma.staff.findUnique({ where: { userId: user.id } });
  if (!staff) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const now = new Date();
  await prisma.staffAttendance.upsert({
    where: { staffId_date: { staffId: staff.id, date: today } },
    update: { inTime: now, status: "PRESENT", source: "WEB_PUNCH" },
    create: { staffId: staff.id, date: today, inTime: now, status: "PRESENT", source: "WEB_PUNCH", hoursWorked: 0 },
  });
  revalidatePath("/hr/attendance");
}

export async function staffClockOut() {
  const session = await auth();
  const user = session!.user as any;
  const staff = await prisma.staff.findUnique({ where: { userId: user.id } });
  if (!staff) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const existing = await prisma.staffAttendance.findUnique({ where: { staffId_date: { staffId: staff.id, date: today } } });
  if (!existing?.inTime) return;
  const now = new Date();
  const hours = Math.round(((now.getTime() - existing.inTime.getTime()) / 3600_000) * 100) / 100;
  await prisma.staffAttendance.update({
    where: { staffId_date: { staffId: staff.id, date: today } },
    data: { outTime: now, hoursWorked: hours },
  });
  revalidatePath("/hr/attendance");
}
