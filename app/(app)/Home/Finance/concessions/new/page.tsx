import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requestApproval } from "@/lib/approvals";

async function fileRequest(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER", "TEACHER"]);
  const studentId = String(form.get("studentId") ?? "");
  if (!studentId) return;
  const stu = await prisma.student.findFirst({
    where: { id: studentId, schoolId: u.schoolId },
    include: { user: true, class: true },
  });
  if (!stu) return;

  const amount = Math.round(Number(form.get("amount") ?? 0) * 100); // ₹ → paise
  const pct = Number(form.get("pct") ?? 0);
  const typeId = (String(form.get("typeId") ?? "") || null) as string | null;
  const reason = String(form.get("reason") ?? "").trim();

  await requestApproval({
    schoolId: u.schoolId,
    kind: "CONCESSION",
    refEntity: "Student",
    refId: stu.id,
    summary: `Concession for ${stu.user.name}${stu.class?.name ? ` (${stu.class.name})` : ""} — ${
      amount > 0 ? `₹${(amount / 100).toLocaleString("en-IN")}` : `${pct}%`
    }${reason ? `. ${reason}` : ""}`,
    payload: {
      studentId: stu.id,
      typeId,
      amount: amount > 0 ? amount : 0,
      pct: pct > 0 ? pct : 0,
      reason,
      approverId: u.id,
    },
    requestedById: u.id,
  });

  redirect("/Home/Approvals?kind=CONCESSION");
}

export const dynamic = "force-dynamic";

export default async function NewConcessionPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER", "TEACHER"]);
  const [students, types] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId: u.schoolId, deletedAt: null as any },
      include: { user: true, class: true },
      orderBy: { admissionNo: "asc" },
      take: 500,
    }),
    prisma.concessionType.findMany({ where: { schoolId: u.schoolId, active: true } }),
  ]);

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <h1 className="h-page mb-1">Request concession</h1>
      <p className="muted mb-4">Files an approval request. Once approved by admin/principal, the concession is applied to the student's fee account.</p>
      <form action={fileRequest} className="card card-pad space-y-3">
        <div>
          <label className="label">Student *</label>
          <select required className="input" name="studentId">
            <option value="">— Select —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.admissionNo} · {s.user.name} · {s.class?.name ?? "—"}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Type</label>
            <select className="input" name="typeId">
              <option value="">—</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount (₹)</label>
            <input className="input" type="number" min={0} step={1} name="amount" placeholder="0" />
          </div>
          <div>
            <label className="label">Or %</label>
            <input className="input" type="number" min={0} max={100} step={0.5} name="pct" placeholder="0" />
          </div>
        </div>
        <div>
          <label className="label">Reason</label>
          <textarea className="input" rows={3} name="reason" placeholder="Sibling, scholarship, hardship..." />
        </div>
        <div className="flex justify-end gap-2">
          <a href="/Home/Finance/concessions" className="btn-outline">Cancel</a>
          <button className="btn-primary" type="submit">Submit for approval</button>
        </div>
      </form>
    </div>
  );
}
