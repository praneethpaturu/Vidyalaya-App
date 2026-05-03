import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

// UDISE+ — Unified District Information System for Education Plus.
// We compute the standard intake counts (enrolment by gender × class,
// staff counts, infrastructure flags) from live data and persist a
// snapshot in UDISEReport.payload. The actual UDISE+ portal still
// requires manual upload — this gives the operator the data ready to
// paste in / verify.

async function generate(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const academicYear = String(form.get("academicYear") ?? "").trim();
  if (!academicYear) return;

  const [students, staff, classes] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId: u.schoolId, deletedAt: null },
      include: { class: true },
    }),
    prisma.staff.findMany({
      where: { schoolId: u.schoolId, deletedAt: null as any },
    }),
    prisma.class.findMany({ where: { schoolId: u.schoolId } }),
  ]);

  // Enrolment matrix: class → { male, female, other, total }
  const byClass: Record<string, { male: number; female: number; other: number; total: number }> = {};
  for (const c of classes) {
    byClass[c.name] = { male: 0, female: 0, other: 0, total: 0 };
  }
  for (const s of students) {
    const cn = s.class?.name ?? "Unassigned";
    byClass[cn] = byClass[cn] ?? { male: 0, female: 0, other: 0, total: 0 };
    const g = (s.gender ?? "").toLowerCase();
    if (g.startsWith("m")) byClass[cn].male++;
    else if (g.startsWith("f")) byClass[cn].female++;
    else byClass[cn].other++;
    byClass[cn].total++;
  }

  // Staff: teaching vs non-teaching by designation regex.
  const teaching = staff.filter((s) => /teach|professor/i.test(s.designation)).length;
  const nonTeaching = staff.length - teaching;

  // RTE quota count for this AY.
  const rte = await prisma.rTEAdmission.count({ where: { schoolId: u.schoolId, fy: academicYear } });

  const payload = {
    academicYear,
    generatedAt: new Date().toISOString(),
    enrolment: {
      total: students.length,
      male: students.filter((s) => /^m/i.test(s.gender ?? "")).length,
      female: students.filter((s) => /^f/i.test(s.gender ?? "")).length,
      other: students.filter((s) => !/^m|^f/i.test(s.gender ?? "")).length,
      rteQuota: rte,
    },
    enrolmentByClass: byClass,
    staff: {
      total: staff.length,
      teaching,
      nonTeaching,
    },
    classesCount: classes.length,
  };

  await prisma.uDISEReport.upsert({
    where: { schoolId_academicYear: { schoolId: u.schoolId, academicYear } },
    update: { payload: JSON.stringify(payload) },
    create: { schoolId: u.schoolId, academicYear, payload: JSON.stringify(payload) },
  });
  revalidatePath("/Home/Compliance/udise");
  redirect(`/Home/Compliance/udise?fy=${encodeURIComponent(academicYear)}&generated=1`);
}

async function submit(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  await prisma.uDISEReport.updateMany({
    where: { id, schoolId: u.schoolId },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });
  revalidatePath("/Home/Compliance/udise");
}

export const dynamic = "force-dynamic";

export default async function UdisePage({
  searchParams,
}: { searchParams: Promise<{ fy?: string; generated?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sp = await searchParams;
  const today = new Date();
  const fyDefault = today.getMonth() < 3
    ? `${today.getFullYear() - 1}-${today.getFullYear()}`
    : `${today.getFullYear()}-${today.getFullYear() + 1}`;
  const ay = sp.fy ?? fyDefault;

  const [report, allReports] = await Promise.all([
    prisma.uDISEReport.findUnique({ where: { schoolId_academicYear: { schoolId: u.schoolId, academicYear: ay } } }),
    prisma.uDISEReport.findMany({ where: { schoolId: u.schoolId }, orderBy: { academicYear: "desc" } }),
  ]);

  const data = report ? (() => { try { return JSON.parse(report.payload); } catch { return null; } })() : null;

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">UDISE+ report</h1>
      <p className="muted mb-3">
        Unified District Information System for Education. Generate the standard intake counts for
        the academic year, then verify and submit on the official UDISE+ portal.
      </p>

      {sp.generated && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Snapshot generated.</div>}

      <form action={generate} className="card card-pad mb-5 flex gap-3 items-end">
        <div className="flex-1">
          <label className="label">Academic year</label>
          <input name="academicYear" className="input" defaultValue={ay} />
        </div>
        <button type="submit" className="btn-primary">Generate / refresh</button>
      </form>

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="card card-pad"><div className="text-[11px] text-slate-500">Total enrolment</div><div className="text-xl font-medium">{data.enrolment.total}</div></div>
            <div className="card card-pad"><div className="text-[11px] text-slate-500">Male</div><div className="text-xl font-medium">{data.enrolment.male}</div></div>
            <div className="card card-pad"><div className="text-[11px] text-slate-500">Female</div><div className="text-xl font-medium">{data.enrolment.female}</div></div>
            <div className="card card-pad"><div className="text-[11px] text-slate-500">RTE quota</div><div className="text-xl font-medium">{data.enrolment.rteQuota}</div></div>
            <div className="card card-pad"><div className="text-[11px] text-slate-500">Teaching staff</div><div className="text-xl font-medium">{data.staff.teaching}</div></div>
            <div className="card card-pad"><div className="text-[11px] text-slate-500">Non-teaching</div><div className="text-xl font-medium">{data.staff.nonTeaching}</div></div>
            <div className="card card-pad"><div className="text-[11px] text-slate-500">Total staff</div><div className="text-xl font-medium">{data.staff.total}</div></div>
            <div className="card card-pad"><div className="text-[11px] text-slate-500">Classes</div><div className="text-xl font-medium">{data.classesCount}</div></div>
          </div>

          <h2 className="h-section mb-2">Enrolment by class &amp; gender</h2>
          <div className="card overflow-x-auto mb-5">
            <table className="table">
              <thead>
                <tr><th>Class</th><th className="text-right">Male</th><th className="text-right">Female</th><th className="text-right">Other</th><th className="text-right">Total</th></tr>
              </thead>
              <tbody>
                {Object.entries(data.enrolmentByClass).map(([k, v]: [string, any]) => (
                  <tr key={k}>
                    <td className="font-medium">{k}</td>
                    <td className="text-right tabular-nums">{v.male}</td>
                    <td className="text-right tabular-nums">{v.female}</td>
                    <td className="text-right tabular-nums">{v.other}</td>
                    <td className="text-right font-semibold">{v.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {report && (
            <div className="flex justify-end gap-2 mb-5">
              <a href={`/api/reports/udise?fy=${encodeURIComponent(ay)}`} className="btn-outline">Download JSON</a>
              {report.status !== "SUBMITTED" && (
                <form action={submit}>
                  <input type="hidden" name="id" value={report.id} />
                  <button className="btn-primary">Mark submitted</button>
                </form>
              )}
            </div>
          )}
        </>
      )}

      {allReports.length > 0 && (
        <>
          <h2 className="h-section mb-2">Past reports</h2>
          <div className="card overflow-x-auto">
            <table className="table">
              <thead><tr><th>AY</th><th>Status</th><th>Generated</th><th>Submitted</th></tr></thead>
              <tbody>
                {allReports.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/Home/Compliance/udise?fy=${encodeURIComponent(r.academicYear)}`} className="text-brand-700 hover:underline">
                        {r.academicYear}
                      </Link>
                    </td>
                    <td>
                      <span className={r.status === "SUBMITTED" ? "badge-green" : r.status === "ACCEPTED" ? "badge-blue" : r.status === "REJECTED" ? "badge-red" : "badge-amber"}>
                        {r.status}
                      </span>
                    </td>
                    <td className="text-xs">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="text-xs">{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("en-IN") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
