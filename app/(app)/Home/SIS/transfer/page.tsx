import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TransferClient from "./TransferClient";

export const dynamic = "force-dynamic";

export default async function SISTransferPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; transferred?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  // Eligible destination schools: same OrgGroup if our school has one,
  // otherwise show all schools we can find. Multi-branch chains use Group.
  const me = await prisma.school.findUnique({ where: { id: u.schoolId } });
  const peers = await prisma.school.findMany({
    where: {
      id: { not: u.schoolId },
      ...(me?.groupId ? { groupId: me.groupId } : {}),
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  const students = q
    ? await prisma.student.findMany({
        where: {
          schoolId: u.schoolId, deletedAt: null,
          OR: [
            { admissionNo: { contains: q, mode: "insensitive" } },
            { user: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
        include: { user: true, class: true },
        orderBy: { admissionNo: "asc" },
        take: 50,
      })
    : [];

  const recent = await prisma.studentTransfer.findMany({
    where: { OR: [{ fromSchoolId: u.schoolId }, { toSchoolId: u.schoolId }] },
    orderBy: { effectiveAt: "desc" },
    take: 50,
  });

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Inter-branch transfer</h1>
      <p className="muted mb-3">
        Move a student from this branch to another branch in the same chain.
        Source record is soft-deleted; the destination branch can complete the
        admission with the same admission number to maintain continuity.
      </p>

      {sp.transferred && (
        <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">
          Transfer initiated. The destination branch admin must complete intake.
        </div>
      )}

      <TransferClient
        peers={peers.map((p) => ({ id: p.id, name: p.name, city: p.city }))}
        searchedStudents={students.map((s) => ({
          id: s.id,
          admissionNo: s.admissionNo,
          name: s.user.name,
          className: s.class?.name ?? "—",
        }))}
        currentQuery={q}
      />

      <h2 className="h-section mt-8 mb-2">Recent transfers</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Effective</th><th>Direction</th><th>Student</th><th>Reason</th><th>Status</th></tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr><td colSpan={5} className="text-center text-slate-500 py-8">No transfers logged.</td></tr>
            )}
            {recent.map((t) => (
              <tr key={t.id}>
                <td className="text-xs">{new Date(t.effectiveAt).toLocaleDateString("en-IN")}</td>
                <td className="text-xs">
                  {t.fromSchoolId === u.schoolId ? "Outbound →" : "← Inbound"}
                </td>
                <td className="font-mono text-xs">{t.studentId}</td>
                <td className="text-xs">{t.reason ?? "—"}</td>
                <td>
                  <span className={
                    t.status === "COMPLETED" ? "badge-green" :
                    t.status === "CANCELLED" ? "badge-red" : "badge-amber"
                  }>{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
