import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildBonafidePdf, buildTransferCertPdf, buildCharacterCertPdf, buildIdCardPdf,
} from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; type: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const u = session.user as any;
  const { id, type } = await params;

  const stu = await prisma.student.findUnique({
    where: { id },
    include: {
      user: true, class: true, school: true,
      guardians: { include: { guardian: { include: { user: true } } } },
    },
  });
  if (!stu || stu.schoolId !== u.schoolId) return NextResponse.json({ error: "not found" }, { status: 404 });

  const father = stu.guardians.find((g) => g.guardian.relation === "Father")?.guardian.user.name ?? null;
  const mother = stu.guardians.find((g) => g.guardian.relation === "Mother")?.guardian.user.name ?? null;
  const certNo = `CERT/${type.toUpperCase()}/${stu.admissionNo}/${new Date().getFullYear()}`;
  const common = {
    school: { name: stu.school.name, city: stu.school.city, state: stu.school.state, pincode: stu.school.pincode, phone: stu.school.phone, email: stu.school.email },
    student: {
      name: stu.user.name, admissionNo: stu.admissionNo, rollNo: stu.rollNo,
      className: stu.class?.name ?? null, dob: stu.dob, gender: stu.gender, bloodGroup: stu.bloodGroup,
      address: stu.address, fatherName: father, motherName: mother,
    },
    certNo, issueDate: new Date(),
  };

  let buf: Buffer;
  if (type === "bonafide") buf = await buildBonafidePdf(common);
  else if (type === "transfer") buf = await buildTransferCertPdf({ ...common, lastClassPassed: stu.class?.name ?? null, lastDateAttended: new Date(), reasonForLeaving: "Transfer to another school" });
  else if (type === "character") buf = await buildCharacterCertPdf({ ...common, conduct: "very good" });
  else if (type === "id-card") buf = await buildIdCardPdf(common);
  else return NextResponse.json({ error: "unknown cert" }, { status: 400 });

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${type}-${stu.admissionNo}.pdf"`,
    },
  });
}
