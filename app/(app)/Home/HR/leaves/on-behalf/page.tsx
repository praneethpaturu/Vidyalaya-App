import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requestApproval } from "@/lib/approvals";

async function fileOnBehalf(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const staffId = String(form.get("staffId") ?? "");
  if (!staffId) return;
  const staff = await prisma.staff.findFirst({
    where: { id: staffId, schoolId: u.schoolId },
    include: { user: true },
  });
  if (!staff) return;

  const fromDate = String(form.get("fromDate") ?? "");
  const toDate = String(form.get("toDate") ?? "");
  if (!fromDate || !toDate) return;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const days = Math.max(1, Math.round((+to - +from) / 86400000) + 1);

  await requestApproval({
    schoolId: u.schoolId,
    kind: "LEAVE_ON_BEHALF",
    refEntity: "Staff",
    refId: staffId,
    summary: `Leave on behalf of ${staff.user.name} (${days}d, ${fromDate} → ${toDate})`,
    payload: {
      staffId,
      fromDate, toDate, days,
      type: String(form.get("type") ?? "CASUAL"),
      halfDay: form.get("halfDay") === "on",
      reason: String(form.get("reason") ?? ""),
    },
    requestedById: u.id,
  });

  redirect("/Home/Approvals?kind=LEAVE_ON_BEHALF");
}

export const dynamic = "force-dynamic";

export default async function OnBehalfPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const staff = await prisma.staff.findMany({
    where: { schoolId: u.schoolId, deletedAt: null as any },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
    take: 500,
  });

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <h1 className="h-page mb-1">Leave on behalf of staff</h1>
      <p className="muted mb-4">
        File a leave request on behalf of an employee — useful when the staff member is sick
        and unable to apply themselves. The request is queued for approval; on approval the
        leave is recorded against their balance.
      </p>
      <form action={fileOnBehalf} className="card card-pad space-y-3">
        <div>
          <label className="label">Staff *</label>
          <select required className="input" name="staffId">
            <option value="">— Select —</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.user.name} · {s.user.email}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">From *</label>
            <input required type="date" className="input" name="fromDate" />
          </div>
          <div>
            <label className="label">To *</label>
            <input required type="date" className="input" name="toDate" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type</label>
            <select className="input" name="type" defaultValue="CASUAL">
              <option>CASUAL</option>
              <option>SICK</option>
              <option>EARNED</option>
              <option>UNPAID</option>
              <option>MATERNITY</option>
              <option>PATERNITY</option>
              <option>OTHER</option>
            </select>
          </div>
          <label className="text-sm flex items-center gap-2 pt-7">
            <input type="checkbox" name="halfDay" /> Half-day
          </label>
        </div>
        <div>
          <label className="label">Reason</label>
          <textarea className="input" rows={3} name="reason" placeholder="Hospitalised; emergency at home; …" />
        </div>
        <div className="flex justify-end gap-2">
          <a href="/Home/HR/leaves" className="btn-outline">Cancel</a>
          <button type="submit" className="btn-primary">Submit for approval</button>
        </div>
      </form>
    </div>
  );
}
