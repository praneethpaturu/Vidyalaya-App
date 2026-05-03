import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function tagRTE(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const studentId = String(form.get("studentId"));
  const fy = String(form.get("fy") ?? "").trim();
  if (!studentId || !fy) return;
  const stu = await prisma.student.findFirst({ where: { id: studentId, schoolId: u.schoolId } });
  if (!stu) return;
  await prisma.rTEAdmission.upsert({
    where: { studentId },
    update: {
      fy,
      district: String(form.get("district") ?? "") || null,
      category: String(form.get("category") ?? "") || null,
      documentUrl: String(form.get("documentUrl") ?? "") || null,
      notes: String(form.get("notes") ?? "") || null,
      approvedAt: new Date(),
      approvedById: u.id,
    },
    create: {
      schoolId: u.schoolId,
      studentId, fy,
      district: String(form.get("district") ?? "") || null,
      category: String(form.get("category") ?? "") || null,
      documentUrl: String(form.get("documentUrl") ?? "") || null,
      notes: String(form.get("notes") ?? "") || null,
      approvedAt: new Date(),
      approvedById: u.id,
    },
  });
  revalidatePath("/Home/Compliance/rte");
  redirect("/Home/Compliance/rte?tagged=1");
}

async function untagRTE(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  await prisma.rTEAdmission.deleteMany({ where: { id, schoolId: u.schoolId } });
  revalidatePath("/Home/Compliance/rte");
}

export const dynamic = "force-dynamic";

export default async function RTEPage({
  searchParams,
}: { searchParams: Promise<{ tagged?: string; fy?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sp = await searchParams;
  const today = new Date();
  const fyDefault = today.getMonth() < 3
    ? `${today.getFullYear() - 1}-${String(today.getFullYear()).slice(-2)}`
    : `${today.getFullYear()}-${String(today.getFullYear() + 1).slice(-2)}`;
  const fy = sp.fy ?? fyDefault;

  const [rteRows, totalActive, students] = await Promise.all([
    prisma.rTEAdmission.findMany({
      where: { schoolId: u.schoolId, fy },
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.count({ where: { schoolId: u.schoolId, deletedAt: null } }),
    prisma.student.findMany({
      where: { schoolId: u.schoolId, deletedAt: null },
      include: { user: true, class: true },
      orderBy: { admissionNo: "asc" },
      take: 1000,
    }),
  ]);
  const rteIds = new Set(rteRows.map((r) => r.studentId));
  const rteCount = rteRows.length;
  const targetCount = Math.ceil(totalActive * 0.25);
  const stuMap = new Map(students.map((s) => [s.id, s]));

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">RTE 25% quota</h1>
      <p className="muted mb-3">
        Right to Education Act mandates 25% of entry-level seats for economically-weaker / disadvantaged
        children. Tag students whose admission was filled under this clause.
      </p>
      {sp.tagged && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Tag saved.</div>}

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card card-pad"><div className="text-[11px] text-slate-500">RTE admissions ({fy})</div><div className="text-xl font-medium">{rteCount}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Total active students</div><div className="text-xl font-medium">{totalActive}</div></div>
        <div className="card card-pad">
          <div className="text-[11px] text-slate-500">Compliance vs 25%</div>
          <div className={`text-xl font-medium ${rteCount >= targetCount ? "text-emerald-700" : "text-rose-700"}`}>
            {rteCount} / {targetCount}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {[fyDefault].concat(["2025-26", "2024-25"].filter((y) => y !== fyDefault)).map((y) => (
            <a key={y} href={`/Home/Compliance/rte?fy=${y}`} className={`text-xs px-3 py-1 rounded-full ${y === fy ? "bg-brand-700 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>{y}</a>
          ))}
        </div>
      </div>

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ Tag a student as RTE admission</summary>
        <form action={tagRTE} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <div className="md:col-span-2">
            <label className="label">Student *</label>
            <select required name="studentId" className="input" defaultValue="">
              <option value="">— Select —</option>
              {students.filter((s) => !rteIds.has(s.id)).map((s) => (
                <option key={s.id} value={s.id}>{s.admissionNo} · {s.user.name} · {s.class?.name ?? "—"}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">FY</label>
            <input name="fy" className="input" defaultValue={fy} />
          </div>
          <div>
            <label className="label">District</label>
            <input name="district" className="input" />
          </div>
          <div>
            <label className="label">Category</label>
            <select name="category" className="input" defaultValue="">
              <option value="">—</option>
              <option>SC</option><option>ST</option><option>OBC</option><option>BPL</option><option>OTHER</option>
            </select>
          </div>
          <div>
            <label className="label">Document URL</label>
            <input name="documentUrl" className="input" placeholder="BPL card / income cert" />
          </div>
          <div className="md:col-span-3">
            <label className="label">Notes</label>
            <input name="notes" className="input" />
          </div>
          <button type="submit" className="btn-primary md:col-span-3">Save tag</button>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Adm No</th><th>Student</th><th>Class</th><th>District</th><th>Category</th><th>Tagged on</th><th></th></tr>
          </thead>
          <tbody>
            {rteRows.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">No RTE admissions tagged for {fy}.</td></tr>}
            {rteRows.map((r) => {
              const s = stuMap.get(r.studentId);
              return (
                <tr key={r.id}>
                  <td className="font-mono text-xs">{s?.admissionNo ?? r.studentId.slice(-6)}</td>
                  <td>{s?.user.name ?? "—"}</td>
                  <td>{s?.class?.name ?? "—"}</td>
                  <td>{r.district ?? "—"}</td>
                  <td><span className="badge-slate text-xs">{r.category ?? "—"}</span></td>
                  <td className="text-xs">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="text-right">
                    <form action={untagRTE} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="text-rose-700 text-xs hover:underline">Untag</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
