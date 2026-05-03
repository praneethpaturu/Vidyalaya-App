import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import MonthlyAttendanceClient from "./MonthlyAttendanceClient";

export const dynamic = "force-dynamic";

export default async function MonthlyAttendancePage({
  searchParams,
}: { searchParams: Promise<{ classId?: string; year?: string; month?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const sp = await searchParams;
  const today = new Date();
  const year = Number(sp.year ?? today.getFullYear());
  const month = Number(sp.month ?? today.getMonth() + 1);

  const classes = await prisma.class.findMany({
    where: { schoolId: u.schoolId },
    orderBy: [{ grade: "asc" }, { section: "asc" }],
  });
  const classId = sp.classId || classes[0]?.id || "";

  let students: { id: string; admissionNo: string; rollNo: string; name: string }[] = [];
  let existing: Record<string, { workingDays: number; presentDays: number; lateDays: number; earlyLeaveDays: number; remarks: string | null }> = {};

  if (classId) {
    const stuRows = await prisma.student.findMany({
      where: { schoolId: u.schoolId, classId, deletedAt: null as any },
      include: { user: true },
      orderBy: [{ rollNo: "asc" }, { admissionNo: "asc" }],
    });
    students = stuRows.map((s) => ({
      id: s.id,
      admissionNo: s.admissionNo,
      rollNo: s.rollNo,
      name: s.user.name,
    }));

    const ex = await prisma.monthlyAttendance.findMany({
      where: { schoolId: u.schoolId, classId, year, month },
    });
    for (const e of ex) {
      existing[e.studentId] = {
        workingDays: e.workingDays,
        presentDays: e.presentDays,
        lateDays: e.lateDays,
        earlyLeaveDays: e.earlyLeaveDays,
        remarks: e.remarks,
      };
    }
  }

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-1">Monthly attendance</h1>
      <p className="muted mb-5">
        Capture aggregated attendance per student for a calendar month — used in monthly
        report cards and parent-app calendars. Working days defaults to the same value for
        the whole class but you can override per row.
      </p>

      <MonthlyAttendanceClient
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        selectedClassId={classId}
        year={year}
        month={month}
        students={students}
        existing={existing}
      />
    </div>
  );
}
