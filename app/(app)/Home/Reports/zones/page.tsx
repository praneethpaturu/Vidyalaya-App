import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

// Multi-school chain rollup. Aggregates students / staff / fees /
// concerns / outstanding dues across every branch in the same OrgGroup
// (or every branch the user can see if no group is set).
//
// Visible only to ADMIN/PRINCIPAL — and only useful when at least one
// peer branch exists in the same group.

export const dynamic = "force-dynamic";

export default async function ZoneRollupPage({
  searchParams,
}: { searchParams: Promise<{ groupId?: string; zoneId?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sp = await searchParams;
  const me = await prisma.school.findUnique({ where: { id: u.schoolId } });

  const where: any = {};
  const filterGroupId = sp.groupId ?? me?.groupId ?? undefined;
  const filterZoneId = sp.zoneId ?? me?.zoneId ?? undefined;
  if (filterGroupId) where.groupId = filterGroupId;
  if (filterZoneId) where.zoneId = filterZoneId;

  const [schools, groups, zones] = await Promise.all([
    prisma.school.findMany({
      where,
      orderBy: { name: "asc" },
    }),
    prisma.orgGroup.findMany({ orderBy: { name: "asc" } }),
    prisma.zone.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Per-school rollups
  const ids = schools.map((s) => s.id);
  const [stuCounts, staffCounts, dues, concerns, payments] = await Promise.all([
    prisma.student.groupBy({ by: ["schoolId"], where: { schoolId: { in: ids }, deletedAt: null }, _count: { _all: true } }),
    prisma.staff.groupBy({ by: ["schoolId"], where: { schoolId: { in: ids }, deletedAt: null as any }, _count: { _all: true } }),
    prisma.invoice.groupBy({
      by: ["schoolId"],
      where: { schoolId: { in: ids }, status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] } },
      _sum: { total: true, amountPaid: true },
    }),
    prisma.concern.groupBy({
      by: ["schoolId"],
      where: { schoolId: { in: ids }, status: { in: ["OPEN", "IN_PROGRESS"] } },
      _count: { _all: true },
    }),
    prisma.payment.groupBy({
      by: ["schoolId"],
      where: {
        schoolId: { in: ids },
        paidAt: { gte: new Date(Date.now() - 30 * 86400000) },
      },
      _sum: { amount: true },
    }),
  ]);
  const m = (rows: any[], key: string) => new Map(rows.map((r) => [r.schoolId, r[key]]));
  const stuByS = new Map(stuCounts.map((r) => [r.schoolId, r._count._all]));
  const staffByS = new Map(staffCounts.map((r) => [r.schoolId, r._count._all]));
  const conByS = new Map(concerns.map((r) => [r.schoolId, r._count._all]));
  const dueByS = new Map(dues.map((r) => [r.schoolId, (r._sum.total ?? 0) - (r._sum.amountPaid ?? 0)]));
  const collByS = new Map(payments.map((r) => [r.schoolId, r._sum.amount ?? 0]));

  const totals = {
    students: schools.reduce((s, sc) => s + (stuByS.get(sc.id) ?? 0), 0),
    staff:    schools.reduce((s, sc) => s + (staffByS.get(sc.id) ?? 0), 0),
    dues:     schools.reduce((s, sc) => s + (dueByS.get(sc.id) ?? 0), 0),
    concerns: schools.reduce((s, sc) => s + (conByS.get(sc.id) ?? 0), 0),
    coll30d:  schools.reduce((s, sc) => s + (collByS.get(sc.id) ?? 0), 0),
  };

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-1">Multi-branch rollup</h1>
      <p className="muted mb-3">
        Aggregated metrics across all branches in your group / zone. Click a row to drill into that
        branch's data (you'll need login access to that branch).
      </p>

      <div className="card card-pad mb-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Group</label>
          <select className="input" defaultValue={filterGroupId ?? ""}>
            <option value="">— All groups —</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Zone</label>
          <select className="input" defaultValue={filterZoneId ?? ""}>
            <option value="">— All zones —</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </select>
        </div>
        <div className="ml-auto text-xs text-slate-500">
          {schools.length} branch{schools.length !== 1 ? "es" : ""}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Total students</div><div className="text-xl font-medium">{totals.students.toLocaleString()}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Total staff</div><div className="text-xl font-medium">{totals.staff.toLocaleString()}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Outstanding dues</div><div className="text-xl font-medium text-rose-700">{inr(totals.dues)}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Collected (30d)</div><div className="text-xl font-medium text-emerald-700">{inr(totals.coll30d)}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Open concerns</div><div className="text-xl font-medium text-amber-700">{totals.concerns}</div></div>
      </div>

      <h2 className="h-section mb-2">Per-branch breakdown</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Branch</th><th>City</th>
              <th className="text-right">Students</th>
              <th className="text-right">Staff</th>
              <th className="text-right">Dues</th>
              <th className="text-right">Coll. 30d</th>
              <th className="text-right">Concerns</th>
            </tr>
          </thead>
          <tbody>
            {schools.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">No branches in scope.</td></tr>}
            {schools.map((s) => (
              <tr key={s.id}>
                <td className="font-medium">{s.name}{s.id === u.schoolId && <span className="text-xs text-emerald-700 ml-2">(this branch)</span>}</td>
                <td className="text-xs">{s.city}</td>
                <td className="text-right tabular-nums">{(stuByS.get(s.id) ?? 0).toLocaleString()}</td>
                <td className="text-right tabular-nums">{(staffByS.get(s.id) ?? 0).toLocaleString()}</td>
                <td className="text-right tabular-nums text-rose-700">{inr(dueByS.get(s.id) ?? 0)}</td>
                <td className="text-right tabular-nums text-emerald-700">{inr(collByS.get(s.id) ?? 0)}</td>
                <td className="text-right tabular-nums">{conByS.get(s.id) ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
