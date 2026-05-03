import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL"]);
  const sp = new URL(req.url).searchParams;
  const where: any = { schoolId: u.schoolId };
  if (sp.get("status")) where.status = sp.get("status");

  const rows = await prisma.applicationForm.findMany({ where, orderBy: { createdAt: "desc" } });
  const out = rows.map((a) => ({
    applicationNo: a.applicationNo,
    studentFirstName: a.studentFirstName,
    studentLastName: a.studentLastName ?? "",
    studentDob: a.studentDob ? new Date(a.studentDob).toISOString().slice(0, 10) : "",
    studentGender: a.studentGender ?? "",
    optingClass: a.optingClassName ?? "",
    admissionType: a.admissionType ?? "",
    fatherName: a.fatherName ?? "",
    fatherPhone: a.fatherPhone ?? "",
    fatherEmail: a.fatherEmail ?? "",
    motherName: a.motherName ?? "",
    motherPhone: a.motherPhone ?? "",
    address: a.address ?? "",
    previousSchool: a.previousSchool ?? "",
    needsTransport: a.needsTransport ? "Yes" : "No",
    applicationFee: (a.applicationFee / 100).toFixed(2),
    feePaid: a.feePaid ? "Yes" : "No",
    feeReceiptNo: a.feeReceiptNo ?? "",
    status: a.status,
    expectedReportingDate: a.expectedReportingDate ? new Date(a.expectedReportingDate).toISOString().slice(0, 10) : "",
    admittedStudentId: a.admittedStudentId ?? "",
    createdAt: new Date(a.createdAt).toISOString(),
  }));
  const cols = [
    { key: "applicationNo", label: "App No" },
    { key: "studentFirstName", label: "First name" },
    { key: "studentLastName", label: "Last name" },
    { key: "studentDob", label: "DOB" },
    { key: "studentGender", label: "Gender" },
    { key: "optingClass", label: "Class" },
    { key: "admissionType", label: "Type" },
    { key: "fatherName", label: "Father" },
    { key: "fatherPhone", label: "Father phone" },
    { key: "fatherEmail", label: "Father email" },
    { key: "motherName", label: "Mother" },
    { key: "motherPhone", label: "Mother phone" },
    { key: "address", label: "Address" },
    { key: "previousSchool", label: "Previous school" },
    { key: "needsTransport", label: "Transport" },
    { key: "applicationFee", label: "Fee (₹)" },
    { key: "feePaid", label: "Paid" },
    { key: "feeReceiptNo", label: "Receipt" },
    { key: "status", label: "Status" },
    { key: "expectedReportingDate", label: "Reporting" },
    { key: "admittedStudentId", label: "Student ID" },
    { key: "createdAt", label: "Created" },
  ] as const;
  return csvResponse(toCsv(out as any, cols as any), `applications-${new Date().toISOString().slice(0, 10)}.csv`);
}
