import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function logVisit(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER", "HR_MANAGER"]);
  const symptoms = String(form.get("symptoms") ?? "").trim();
  if (!symptoms) return;
  const studentId = String(form.get("studentId") ?? "") || null;
  const staffId = String(form.get("staffId") ?? "") || null;
  if (!studentId && !staffId) return;
  await prisma.infirmaryVisit.create({
    data: {
      schoolId: u.schoolId,
      studentId, staffId,
      symptoms,
      diagnosis: String(form.get("diagnosis") ?? "") || null,
      medication: String(form.get("medication") ?? "") || null,
      vitals: String(form.get("vitals") ?? "") || null,
      outcome: String(form.get("outcome") ?? "RETURNED_TO_CLASS"),
      parentNotified: form.get("parentNotified") === "on",
      recordedById: u.id,
    },
  });
  revalidatePath("/AddOns/Infirmary");
  redirect("/AddOns/Infirmary?logged=1");
}

export const dynamic = "force-dynamic";

export default async function InfirmaryPage({
  searchParams,
}: { searchParams: Promise<{ logged?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER", "HR_MANAGER"]);
  const sp = await searchParams;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [visits, students, staff] = await Promise.all([
    prisma.infirmaryVisit.findMany({
      where: { schoolId: u.schoolId },
      orderBy: { visitedAt: "desc" },
      take: 100,
    }),
    prisma.student.findMany({
      where: { schoolId: u.schoolId, deletedAt: null },
      include: { user: true, class: true },
      orderBy: { admissionNo: "asc" },
      take: 1000,
    }),
    prisma.staff.findMany({
      where: { schoolId: u.schoolId, deletedAt: null as any },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
  ]);
  const stuMap = new Map(students.map((s) => [s.id, s]));
  const staffMap = new Map(staff.map((s) => [s.id, s]));

  const todayVisits = visits.filter((v) => +new Date(v.visitedAt) >= +today).length;
  const monthVisits = visits.filter((v) => +new Date(v.visitedAt) >= +monthStart).length;
  const sentHome = visits.filter((v) => v.outcome === "SENT_HOME").length;

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Infirmary</h1>
      <p className="muted mb-3">School clinic visit log — symptoms, diagnosis, medication, outcome.</p>
      {sp.logged && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Visit logged.</div>}

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Today</div><div className="text-xl font-medium">{todayVisits}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">This month</div><div className="text-xl font-medium">{monthVisits}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Sent home (recent)</div><div className="text-xl font-medium text-rose-700">{sentHome}</div></div>
      </div>

      <details className="card card-pad mb-5" open>
        <summary className="cursor-pointer font-medium">+ Log a visit</summary>
        <form action={logVisit} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end mt-3">
          <div>
            <label className="label">Student</label>
            <select name="studentId" className="input" defaultValue="">
              <option value="">— None —</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.admissionNo} · {s.user.name} · {s.class?.name ?? "—"}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Or staff</label>
            <select name="staffId" className="input" defaultValue="">
              <option value="">— None —</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.user.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Symptoms *</label>
            <input required name="symptoms" className="input" placeholder="Headache, mild fever" />
          </div>
          <div>
            <label className="label">Diagnosis</label>
            <input name="diagnosis" className="input" />
          </div>
          <div>
            <label className="label">Medication</label>
            <input name="medication" className="input" placeholder="Paracetamol 500mg, ORS" />
          </div>
          <div>
            <label className="label">Vitals</label>
            <input name="vitals" className="input" placeholder="BP 120/80, Temp 38.5°C" />
          </div>
          <div>
            <label className="label">Outcome</label>
            <select name="outcome" className="input" defaultValue="RETURNED_TO_CLASS">
              <option value="RETURNED_TO_CLASS">Returned to class</option>
              <option value="UNDER_OBSERVATION">Under observation</option>
              <option value="SENT_HOME">Sent home</option>
              <option value="HOSPITAL">Referred to hospital</option>
            </select>
          </div>
          <label className="text-sm flex items-center gap-2 md:col-span-2">
            <input type="checkbox" name="parentNotified" /> Parent notified
          </label>
          <button type="submit" className="btn-primary md:col-span-2">Save visit</button>
        </form>
      </details>

      <h2 className="h-section mb-2">Recent visits</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>When</th><th>Person</th><th>Symptoms</th><th>Outcome</th><th>Parent</th></tr>
          </thead>
          <tbody>
            {visits.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">No visits logged.</td></tr>}
            {visits.map((v) => {
              const stu = v.studentId ? stuMap.get(v.studentId) : null;
              const stf = v.staffId ? staffMap.get(v.staffId) : null;
              return (
                <tr key={v.id}>
                  <td className="text-xs">{new Date(v.visitedAt).toLocaleString("en-IN")}</td>
                  <td>
                    {stu ? `${stu.user.name} · ${stu.class?.name ?? "—"}` : stf ? `${stf.user.name} (staff)` : "—"}
                  </td>
                  <td className="max-w-md truncate">{v.symptoms}</td>
                  <td>
                    <span className={
                      v.outcome === "SENT_HOME" ? "badge-amber" :
                      v.outcome === "HOSPITAL" ? "badge-red" :
                      v.outcome === "UNDER_OBSERVATION" ? "badge-blue" : "badge-green"
                    }>{v.outcome.replace(/_/g, " ")}</span>
                  </td>
                  <td className="text-xs">{v.parentNotified ? "✓ Notified" : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
