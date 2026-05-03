import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function bookTraining(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER", "TEACHER"]);
  const type = String(form.get("type") ?? "TRAINING_AM");
  const subject = String(form.get("subject") ?? "").trim();
  if (!subject) return;
  await prisma.supportRequest.create({
    data: {
      schoolId: u.schoolId,
      requestedById: u.id,
      requestedByName: u.name,
      type,
      subject,
      body: String(form.get("body") ?? ""),
      preferredAt: form.get("preferredAt") ? new Date(String(form.get("preferredAt"))) : null,
      contactEmail: u.email,
      contactPhone: String(form.get("contactPhone") ?? "") || null,
    },
  });
  revalidatePath("/support/training");
  redirect("/support/training?booked=1");
}

async function cancel(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER", "TEACHER"]);
  const id = String(form.get("id"));
  await prisma.supportRequest.updateMany({
    where: { id, schoolId: u.schoolId },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/support/training");
}

export const dynamic = "force-dynamic";

export default async function TrainingPage({
  searchParams,
}: { searchParams: Promise<{ booked?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER", "TEACHER"]);
  const sp = await searchParams;
  const items = await prisma.supportRequest.findMany({
    where: { schoolId: u.schoolId, type: { in: ["TRAINING_AM", "CSM_MEETING"] } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const upcoming = items.filter((i) => i.status === "SCHEDULED" || i.status === "OPEN");
  const past = items.filter((i) => i.status === "RESOLVED" || i.status === "CANCELLED");

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <Link href="/support" className="text-xs text-brand-700 hover:underline">← Back to support</Link>
      <h1 className="h-page mt-1 mb-1">Training & meetings</h1>
      <p className="muted mb-3">Book a 1:1 with your Account Manager or Customer Success Manager.</p>

      {sp.booked && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Booking submitted. We'll reach out to confirm a time.</div>}

      <details className="card card-pad mb-5" open>
        <summary className="cursor-pointer font-medium">+ New booking</summary>
        <form action={bookTraining} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end mt-3">
          <div>
            <label className="label">With</label>
            <select name="type" className="input" defaultValue="TRAINING_AM">
              <option value="TRAINING_AM">Account Manager — training</option>
              <option value="CSM_MEETING">Customer Success Manager — review meeting</option>
            </select>
          </div>
          <div>
            <label className="label">Preferred time</label>
            <input type="datetime-local" name="preferredAt" className="input" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Subject *</label>
            <input required name="subject" className="input" placeholder="Walk-through of HR Payroll for our accountants" />
          </div>
          <div className="md:col-span-2">
            <label className="label">What you want covered</label>
            <textarea name="body" rows={3} className="input" />
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input name="contactPhone" className="input" />
          </div>
          <button type="submit" className="btn-primary md:col-span-2">Submit booking</button>
        </form>
      </details>

      <h2 className="h-section mb-2">Upcoming</h2>
      <div className="card overflow-x-auto mb-5">
        <table className="table">
          <thead><tr><th>Type</th><th>Subject</th><th>Preferred / scheduled</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {upcoming.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">No bookings.</td></tr>}
            {upcoming.map((i) => (
              <tr key={i.id}>
                <td><span className="badge-blue text-xs">{i.type === "TRAINING_AM" ? "Account Mgr" : "CSM"}</span></td>
                <td>{i.subject}</td>
                <td className="text-xs">
                  {i.scheduledAt
                    ? new Date(i.scheduledAt).toLocaleString("en-IN")
                    : i.preferredAt ? `Pref. ${new Date(i.preferredAt).toLocaleString("en-IN")}` : "—"}
                </td>
                <td>
                  <span className={i.status === "SCHEDULED" ? "badge-green" : "badge-amber"}>
                    {i.status}
                  </span>
                </td>
                <td className="text-right">
                  <form action={cancel} className="inline">
                    <input type="hidden" name="id" value={i.id} />
                    <button type="submit" className="text-rose-700 text-xs hover:underline">Cancel</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {past.length > 0 && (
        <>
          <h2 className="h-section mb-2">Past</h2>
          <div className="card overflow-x-auto">
            <table className="table">
              <thead><tr><th>Type</th><th>Subject</th><th>Status</th><th>Closed</th></tr></thead>
              <tbody>
                {past.map((i) => (
                  <tr key={i.id}>
                    <td><span className="badge-slate text-xs">{i.type === "TRAINING_AM" ? "Account Mgr" : "CSM"}</span></td>
                    <td>{i.subject}</td>
                    <td>
                      <span className={i.status === "CANCELLED" ? "badge-red" : "badge-blue"}>{i.status}</span>
                    </td>
                    <td className="text-xs">
                      {i.resolvedAt ? new Date(i.resolvedAt).toLocaleDateString("en-IN") : "—"}
                    </td>
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
