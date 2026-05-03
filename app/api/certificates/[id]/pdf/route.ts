import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildBonafidePdf, buildTransferCertPdf, buildCharacterCertPdf,
  buildGenericCertPdf, type CertCommon,
} from "@/lib/pdf";

export const runtime = "nodejs";

const STAFF_ROLES = new Set(["ADMIN", "PRINCIPAL", "TEACHER", "ACCOUNTANT", "HR_MANAGER"]);

const TITLE: Record<string, string> = {
  TC: "Transfer Certificate",
  BONAFIDE: "Bonafide Certificate",
  CHARACTER: "Character Certificate",
  STUDY: "Study Certificate",
  CONDUCT: "Conduct Certificate",
  MIGRATION: "Migration Certificate",
  PROVISIONAL: "Provisional Certificate",
  NO_OBJECTION: "No Objection Certificate",
  ACHIEVEMENT: "Achievement Certificate",
};

function genericBody(type: string, studentName: string, className: string | null): string {
  const cls = className ? `, currently studying in ${className},` : "";
  switch (type) {
    case "STUDY":
      return `This is to certify that ${studentName}${cls} bearing this admission number, is a regular student of this institution. The student has been earnest in academic pursuits and the school records are in order.`;
    case "CONDUCT":
      return `This is to certify that the conduct and character of ${studentName}${cls} during the period of association with this school have been satisfactory.`;
    case "MIGRATION":
      return `This is to certify that ${studentName}${cls} is being granted migration from this institution. The student bears no financial or material dues to the school.`;
    case "PROVISIONAL":
      return `This is to certify that ${studentName}${cls} has provisionally completed the requirements for the current academic year. The detailed mark statement / final certificate will be issued in due course.`;
    case "NO_OBJECTION":
      return `This is to certify that the school has no objection to ${studentName}${cls} pursuing the activity / opportunity for which this certificate is requested. The student is a bonafide member of this institution.`;
    default:
      return `This is to certify that ${studentName}${cls} is a bonafide student of this institution.`;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let u;
  try { u = await requireUser(); }
  catch { return NextResponse.json({ error: "unauth" }, { status: 401 }); }
  const { id } = await params;

  const cert = await prisma.certificateIssue.findUnique({ where: { id } });
  if (!cert || cert.schoolId !== u.schoolId) {
    return NextResponse.json({ error: "not-found" }, { status: 404 });
  }

  const [school, student] = await Promise.all([
    prisma.school.findUnique({ where: { id: cert.schoolId } }),
    cert.studentId
      ? prisma.student.findUnique({
          where: { id: cert.studentId },
          include: {
            user: true, class: true,
            guardians: { include: { guardian: { include: { user: true } } } },
          },
        })
      : Promise.resolve(null),
  ]);
  if (!school) return NextResponse.json({ error: "no-school" }, { status: 404 });
  if (!student) return NextResponse.json({ error: "no-student" }, { status: 404 });

  // Same access policy as the per-exam report card: staff or the student/parent.
  const isOwn = student.userId === u.id ||
    student.guardians.some((gs: any) => gs.guardian.userId === u.id);
  if (!STAFF_ROLES.has(u.role) && !isOwn) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let payload: any = {};
  try { payload = JSON.parse(cert.data || "{}"); } catch {}

  const father = student.guardians.find((g) => g.guardian.relation === "Father")?.guardian.user;
  const mother = student.guardians.find((g) => g.guardian.relation === "Mother")?.guardian.user;
  const common: CertCommon = {
    school: {
      name: school.name, city: school.city, state: school.state,
      pincode: school.pincode, phone: school.phone, email: school.email,
    },
    student: {
      name: student.user.name,
      admissionNo: student.admissionNo,
      rollNo: student.rollNo,
      className: student.class?.name ?? null,
      dob: student.dob,
      gender: student.gender,
      bloodGroup: student.bloodGroup,
      address: student.address,
      fatherName: father?.name ?? null,
      motherName: mother?.name ?? null,
    },
    certNo: cert.serialNo,
    issueDate: cert.issuedAt,
  };

  let buf: Buffer;
  switch (cert.type) {
    case "BONAFIDE":
      buf = await buildBonafidePdf(common);
      break;
    case "TC":
      buf = await buildTransferCertPdf({ ...common, lastClassPassed: student.class?.name ?? null });
      break;
    case "CHARACTER":
      buf = await buildCharacterCertPdf({ ...common, conduct: payload.conduct ?? "very good" });
      break;
    default: {
      const title = TITLE[cert.type] ?? "Certificate";
      const body = genericBody(cert.type, student.user.name, student.class?.name ?? null);
      buf = await buildGenericCertPdf({ ...common, title, body, purpose: payload.purpose });
    }
  }

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${(TITLE[cert.type] ?? "Certificate").replace(/\s+/g, "_")}-${cert.serialNo}.pdf"`,
    },
  });
}
