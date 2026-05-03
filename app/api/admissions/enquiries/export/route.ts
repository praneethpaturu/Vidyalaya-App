import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = await requireRole(["ADMIN", "PRINCIPAL"]);
  const sp = new URL(req.url).searchParams;
  const where: any = { schoolId: u.schoolId };
  if (sp.get("status")) where.status = sp.get("status");
  if (sp.get("source")) where.source = sp.get("source");

  const rows = await prisma.admissionEnquiry.findMany({ where, orderBy: { createdAt: "desc" } });
  const out = rows.map((e) => ({
    childName: e.childName,
    childGender: e.childGender ?? "",
    expectedGrade: e.expectedGrade,
    parentName: e.parentName,
    parentPhone: e.parentPhone,
    parentEmail: e.parentEmail ?? "",
    source: e.source,
    subSource: e.subSource ?? "",
    campaign: e.campaign ?? "",
    preferredBranch: e.preferredBranch ?? "",
    status: e.status,
    lostReason: e.lostReason ?? "",
    applicationFee: (e.applicationFee / 100).toFixed(2),
    feePaid: e.feePaid ? "Yes" : "No",
    createdAt: new Date(e.createdAt).toISOString(),
    notes: e.notes ?? "",
  }));
  const cols = [
    { key: "childName", label: "Child name" },
    { key: "childGender", label: "Gender" },
    { key: "expectedGrade", label: "Expected grade" },
    { key: "parentName", label: "Parent" },
    { key: "parentPhone", label: "Phone" },
    { key: "parentEmail", label: "Email" },
    { key: "source", label: "Source" },
    { key: "subSource", label: "Sub-source" },
    { key: "campaign", label: "Campaign" },
    { key: "preferredBranch", label: "Branch" },
    { key: "status", label: "Stage" },
    { key: "lostReason", label: "Lost reason" },
    { key: "applicationFee", label: "Application fee (₹)" },
    { key: "feePaid", label: "Paid" },
    { key: "createdAt", label: "Created" },
    { key: "notes", label: "Notes" },
  ] as const;
  return csvResponse(toCsv(out as any, cols as any), `enquiries-${new Date().toISOString().slice(0, 10)}.csv`);
}
