import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await requireRole(["ADMIN", "PRINCIPAL"]);
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const explicitAdmissionNo = String(body?.admissionNo ?? "").trim();
  const explicitRollNo = String(body?.rollNo ?? "").trim();

  const app = await prisma.applicationForm.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!app) return NextResponse.json({ ok: false, error: "not-found" }, { status: 404 });
  if (app.admittedStudentId) {
    return NextResponse.json({ ok: false, error: "already-admitted" }, { status: 400 });
  }
  if (!app.optingClassId) {
    return NextResponse.json({ ok: false, error: "missing-opting-class" }, { status: 400 });
  }
  if (app.applicationFee > 0 && !app.feePaid) {
    return NextResponse.json({ ok: false, error: "application-fee-unpaid" }, { status: 400 });
  }

  const seq = await prisma.student.count({ where: { schoolId: u.schoolId } });
  const admissionNo = explicitAdmissionNo || `ADM-${new Date().getFullYear()}-${String(seq + 1).padStart(5, "0")}`;
  if (await prisma.student.findFirst({ where: { schoolId: u.schoolId, admissionNo } })) {
    return NextResponse.json({ ok: false, error: "admission-no-taken" }, { status: 400 });
  }

  const baseEmail = `${admissionNo.toLowerCase()}@students.local`;
  const password = await bcrypt.hash(admissionNo, 10);
  const dob = app.studentDob ?? new Date(2010, 0, 1);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const studentUser = await tx.user.create({
        data: {
          schoolId: u.schoolId,
          email: baseEmail,
          password,
          name: `${app.studentFirstName}${app.studentLastName ? " " + app.studentLastName : ""}`,
          role: "STUDENT",
          active: true,
        },
      });
      const student = await tx.student.create({
        data: {
          schoolId: u.schoolId,
          userId: studentUser.id,
          admissionNo,
          rollNo: explicitRollNo || "0",
          classId: app.optingClassId,
          dob,
          gender: app.studentGender ?? "Other",
          address: app.address ?? "—",
        },
      });

      // Create guardian users only when at least name is set; reuse if email matches.
      const guardians: Array<{ name: string; email: string | null; phone: string | null; relation: string }> = [];
      if (app.fatherName) guardians.push({ name: app.fatherName, email: app.fatherEmail, phone: app.fatherPhone, relation: "Father" });
      if (app.motherName) guardians.push({ name: app.motherName, email: app.motherEmail, phone: app.motherPhone, relation: "Mother" });

      for (const g of guardians) {
        const gemail = (g.email || `${student.id}-${g.relation.toLowerCase()}@guardians.local`).toLowerCase().trim();
        let gu = await tx.user.findUnique({ where: { email: gemail } });
        if (!gu) {
          gu = await tx.user.create({
            data: {
              schoolId: u.schoolId, email: gemail, password,
              name: g.name, phone: g.phone || null, role: "PARENT", active: true,
            },
          });
        }
        let guardian = await tx.guardian.findUnique({ where: { userId: gu.id } });
        if (!guardian) guardian = await tx.guardian.create({ data: { schoolId: u.schoolId, userId: gu.id, relation: g.relation } });
        await tx.guardianStudent.create({
          data: { guardianId: guardian.id, studentId: student.id, isPrimary: g.relation === "Father" },
        }).catch(() => {});
      }

      await tx.applicationForm.update({
        where: { id: app.id },
        data: { status: "ADMITTED", admittedStudentId: student.id },
      });

      if (app.enquiryId) {
        await tx.admissionEnquiry.update({
          where: { id: app.enquiryId },
          data: { status: "ENROLLED" },
        }).catch(() => {});
      }

      return student;
    });

    return NextResponse.json({ ok: true, studentId: created.id, admissionNo });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "admit-failed" }, { status: 500 });
  }
}
