// Parent + admin shared pickup-request page.
// Parents see their own children's requests + a form to file a new one.
// Admins/teachers see all today's pending requests and approve/reject.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function fileRequest(form: FormData) {
  "use server";
  const u = await requirePageRole(["PARENT", "ADMIN", "PRINCIPAL", "TEACHER"]);
  const studentId = String(form.get("studentId"));
  const pickupAt = String(form.get("pickupAt") ?? "");
  const reason = String(form.get("reason") ?? "").trim();
  if (!studentId || !pickupAt || !reason) return;

  const stu = await prisma.student.findFirst({ where: { id: studentId } });
  if (!stu) return;
  // For parents, ensure the student belongs to them.
  if (u.role === "PARENT") {
    const guardian = await prisma.guardian.findFirst({ where: { userId: u.id } });
    if (!guardian) return;
    const gs = await prisma.guardianStudent.findFirst({ where: { guardianId: guardian.id, studentId } });
    if (!gs) return;
  }

  await prisma.pickupRequest.create({
    data: {
      schoolId: stu.schoolId,
      studentId,
      requestedById: u.id,
      pickupAt: new Date(pickupAt),
      reason,
      pickerName: String(form.get("pickerName") ?? "") || null,
      pickerPhone: String(form.get("pickerPhone") ?? "") || null,
      pickerRelation: String(form.get("pickerRelation") ?? "") || null,
    },
  });
  revalidatePath("/pickup");
  redirect("/pickup?filed=1");
}

async function decide(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const id = String(form.get("id"));
  const decision = String(form.get("decision"));
  const status = decision === "APPROVE" ? "APPROVED" : decision === "REJECT" ? "REJECTED" : "COMPLETED";
  await prisma.pickupRequest.updateMany({
    where: { id, schoolId: u.schoolId },
    data: {
      status,
      decidedAt: new Date(),
      decidedById: u.id,
      decisionNote: String(form.get("note") ?? "") || null,
    },
  });
  revalidatePath("/pickup");
}

export const dynamic = "force-dynamic";

export default async function PickupPage({
  searchParams,
}: { searchParams: Promise<{ filed?: string }> }) {
  const u = await requirePageRole(["PARENT", "STUDENT", "ADMIN", "PRINCIPAL", "TEACHER", "TRANSPORT_MANAGER"]);
  const sp = await searchParams;

  // Identify the relevant student set (and the relevant request set).
  let students: Array<{ id: string; admissionNo: string; name: string; className: string; schoolId: string }> = [];
  let requests: any[] = [];

  if (u.role === "PARENT") {
    const guardian = await prisma.guardian.findFirst({
      where: { userId: u.id },
      include: { students: { include: { student: { include: { user: true, class: true } } } } },
    });
    students = (guardian?.students ?? []).map((gs) => ({
      id: gs.student.id,
      admissionNo: gs.student.admissionNo,
      name: gs.student.user.name,
      className: gs.student.class?.name ?? "—",
      schoolId: gs.student.schoolId,
    }));
    requests = await prisma.pickupRequest.findMany({
      where: { studentId: { in: students.map((s) => s.id) } },
      orderBy: { pickupAt: "desc" },
      take: 50,
    });
  } else if (u.role === "STUDENT") {
    const me = await prisma.student.findFirst({ where: { userId: u.id }, include: { user: true, class: true } });
    if (me) {
      students = [{ id: me.id, admissionNo: me.admissionNo, name: me.user.name, className: me.class?.name ?? "—", schoolId: me.schoolId }];
      requests = await prisma.pickupRequest.findMany({
        where: { studentId: me.id },
        orderBy: { pickupAt: "desc" },
        take: 20,
      });
    }
  } else {
    // Staff — see today's pending + recent decided across the school.
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);
    requests = await prisma.pickupRequest.findMany({
      where: {
        schoolId: u.schoolId,
        OR: [
          { status: "PENDING" },
          { pickupAt: { gte: today, lt: tomorrow } },
        ],
      },
      orderBy: { pickupAt: "asc" },
      take: 100,
    });
    const stuRows = await prisma.student.findMany({
      where: { id: { in: requests.map((r) => r.studentId) } },
      include: { user: true, class: true },
    });
    students = stuRows.map((s) => ({
      id: s.id, admissionNo: s.admissionNo,
      name: s.user.name, className: s.class?.name ?? "—",
      schoolId: s.schoolId,
    }));
  }

  const stuMap = new Map(students.map((s) => [s.id, s]));

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Early pickup</h1>
      <p className="muted mb-3">
        {u.role === "PARENT"
          ? "Request an early pickup for your ward. The school will approve and the gate guard will see the request when the picker arrives."
          : "Today's pickup requests across the school. Approve, reject, or mark completed once the child is handed over."}
      </p>

      {sp.filed && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Request submitted.</div>}

      {(u.role === "PARENT" || u.role === "ADMIN" || u.role === "PRINCIPAL" || u.role === "TEACHER") && students.length > 0 && (
        <details className="card card-pad mb-5" open={u.role === "PARENT"}>
          <summary className="cursor-pointer font-medium">+ File a pickup request</summary>
          <form action={fileRequest} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
            <div>
              <label className="label">Student *</label>
              <select required name="studentId" className="input" defaultValue="">
                <option value="">— Select —</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.admissionNo} · {s.name} · {s.className}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Pickup time *</label>
              <input required type="datetime-local" name="pickupAt" className="input" />
            </div>
            <div>
              <label className="label">Reason *</label>
              <input required name="reason" className="input" placeholder="Doctor's appointment" />
            </div>
            <div>
              <label className="label">Picker name</label>
              <input name="pickerName" className="input" />
            </div>
            <div>
              <label className="label">Picker phone</label>
              <input name="pickerPhone" className="input" />
            </div>
            <div>
              <label className="label">Relation</label>
              <input name="pickerRelation" className="input" placeholder="Father / mother / aunt" />
            </div>
            <button type="submit" className="btn-primary md:col-span-3">Submit request</button>
          </form>
        </details>
      )}

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Student</th><th>Pickup at</th><th>Reason</th><th>Picker</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-8">No requests.</td></tr>
            )}
            {requests.map((r) => {
              const s = stuMap.get(r.studentId);
              return (
                <tr key={r.id}>
                  <td>
                    <div className="font-medium">{s?.name ?? r.studentId.slice(-6)}</div>
                    <div className="text-xs text-slate-500">{s?.className ?? ""}</div>
                  </td>
                  <td className="text-xs">{new Date(r.pickupAt).toLocaleString("en-IN")}</td>
                  <td className="text-xs max-w-xs">{r.reason}</td>
                  <td className="text-xs">
                    {r.pickerName ?? "—"}
                    {r.pickerPhone && <div className="text-slate-500">{r.pickerPhone}</div>}
                  </td>
                  <td>
                    <span className={
                      r.status === "APPROVED" ? "badge-green" :
                      r.status === "COMPLETED" ? "badge-blue" :
                      r.status === "REJECTED" ? "badge-red" : "badge-amber"
                    }>{r.status}</span>
                    {r.decisionNote && <div className="text-[10px] text-slate-500 italic mt-0.5">{r.decisionNote}</div>}
                  </td>
                  <td className="text-right whitespace-nowrap space-x-1">
                    {(u.role === "ADMIN" || u.role === "PRINCIPAL" || u.role === "TEACHER" || u.role === "TRANSPORT_MANAGER") && r.status === "PENDING" && (
                      <>
                        <form action={decide} className="inline">
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="decision" value="APPROVE" />
                          <button className="btn-tonal text-xs px-2 py-0.5">Approve</button>
                        </form>
                        <form action={decide} className="inline">
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="decision" value="REJECT" />
                          <button className="btn-outline text-xs px-2 py-0.5">Reject</button>
                        </form>
                      </>
                    )}
                    {(u.role === "ADMIN" || u.role === "PRINCIPAL" || u.role === "TEACHER" || u.role === "TRANSPORT_MANAGER") && r.status === "APPROVED" && (
                      <form action={decide} className="inline">
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="decision" value="COMPLETE" />
                        <button className="btn-tonal text-xs px-2 py-0.5">Mark completed</button>
                      </form>
                    )}
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
