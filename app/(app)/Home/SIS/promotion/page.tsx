import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PromotionClient from "./PromotionClient";

export const dynamic = "force-dynamic";

export default async function PromotionPage({
  searchParams,
}: { searchParams: Promise<{ classId?: string; fromAY?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sp = await searchParams;
  const school = await prisma.school.findUnique({ where: { id: u.schoolId } });
  const fromAY = sp.fromAY || school?.academicYear || "2026-2027";

  const [classes, recent] = await Promise.all([
    prisma.class.findMany({
      where: { schoolId: u.schoolId },
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    }),
    prisma.studentPromotion.findMany({
      where: { schoolId: u.schoolId },
      orderBy: { effectiveAt: "desc" },
      take: 30,
    }),
  ]);

  const classId = sp.classId || classes[0]?.id || "";
  const students = classId
    ? await prisma.student.findMany({
        where: { schoolId: u.schoolId, classId, deletedAt: null as any },
        include: { user: true, class: true },
        orderBy: { admissionNo: "asc" },
      })
    : [];

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-1">Student promotion</h1>
      <p className="muted mb-5">
        Promote a class roster to the next academic year. Choose the action for each student
        — pass & promote (next class), financial promotion (next class but fees still due),
        detain (same class next year), alumni (graduating) or dropout. Promotions are logged
        and can be reverted via approval.
      </p>

      <PromotionClient
        fromAY={fromAY}
        currentSchoolAY={school?.academicYear ?? fromAY}
        classes={classes.map((c) => ({ id: c.id, name: c.name, grade: c.grade, section: c.section }))}
        selectedClassId={classId}
        students={students.map((s) => ({
          id: s.id,
          admissionNo: s.admissionNo,
          rollNo: s.rollNo,
          name: s.user.name,
          classId: s.classId,
          className: s.class?.name ?? "—",
        }))}
      />

      <h2 className="h-section mt-8 mb-2">Recent promotion log</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Student</th><th>From → To</th><th>AY</th><th>Type</th><th>When</th><th>Status</th></tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-8">No promotions logged.</td></tr>
            )}
            {recent.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs">{p.studentId}</td>
                <td className="text-xs">{p.fromClassId ?? "—"} → {p.toClassId ?? "—"}</td>
                <td className="text-xs">{p.fromAcademicYear} → {p.toAcademicYear}</td>
                <td><span className="badge-blue text-xs">{p.type}</span></td>
                <td className="text-xs">{new Date(p.effectiveAt).toLocaleString("en-IN")}</td>
                <td>
                  {p.reverted
                    ? <span className="badge-red text-xs">Reverted</span>
                    : <RevertButton id={p.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RevertButton({ id }: { id: string }) {
  return (
    <Link
      href={`/api/sis/promotion/revert?id=${id}`}
      prefetch={false}
      className="text-xs text-rose-700 hover:underline"
    >Request revert</Link>
  );
}
