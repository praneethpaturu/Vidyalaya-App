import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "TEACHER"]);
  const sp = new URL(req.url).searchParams;
  const where: any = { schoolId: u.schoolId, deletedAt: null };
  if (sp.get("classId")) where.classId = sp.get("classId");

  const rows = await prisma.student.findMany({
    where,
    include: { user: true, class: true, guardians: { include: { guardian: { include: { user: true } } } } },
    orderBy: [{ classId: "asc" }, { rollNo: "asc" }],
  });

  const out = rows.map((s) => {
    const father = s.guardians.find((g) => g.guardian.relation === "Father")?.guardian.user;
    const mother = s.guardians.find((g) => g.guardian.relation === "Mother")?.guardian.user;
    return {
      admissionNo: s.admissionNo,
      rollNo: s.rollNo,
      name: s.user.name,
      email: s.user.email,
      class: s.class?.name ?? "",
      section: s.section ?? "",
      dob: new Date(s.dob).toISOString().slice(0, 10),
      gender: s.gender,
      bloodGroup: s.bloodGroup ?? "",
      address: s.address,
      fatherName: father?.name ?? "",
      fatherPhone: father?.phone ?? "",
      fatherEmail: father?.email ?? "",
      motherName: mother?.name ?? "",
      motherPhone: mother?.phone ?? "",
      motherEmail: mother?.email ?? "",
    };
  });
  const cols = [
    { key: "admissionNo", label: "Admission No" },
    { key: "rollNo", label: "Roll" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "class", label: "Class" },
    { key: "section", label: "Section" },
    { key: "dob", label: "DOB" },
    { key: "gender", label: "Gender" },
    { key: "bloodGroup", label: "Blood" },
    { key: "address", label: "Address" },
    { key: "fatherName", label: "Father name" },
    { key: "fatherPhone", label: "Father phone" },
    { key: "fatherEmail", label: "Father email" },
    { key: "motherName", label: "Mother name" },
    { key: "motherPhone", label: "Mother phone" },
    { key: "motherEmail", label: "Mother email" },
  ] as const;
  return csvResponse(toCsv(out as any, cols as any), `students-${new Date().toISOString().slice(0, 10)}.csv`);
}
