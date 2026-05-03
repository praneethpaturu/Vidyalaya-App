import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function addHearing(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const complaintId = String(form.get("complaintId"));
  const c = await prisma.poshComplaint.findFirst({ where: { id: complaintId, schoolId: u.schoolId } });
  if (!c) return;
  const scheduledAt = String(form.get("scheduledAt") ?? "");
  if (!scheduledAt) return;
  await prisma.poshHearing.create({
    data: {
      complaintId,
      scheduledAt: new Date(scheduledAt),
      attendees: String(form.get("attendees") ?? "") || null,
      notes: String(form.get("notes") ?? "") || null,
      outcome: String(form.get("outcome") ?? "") || null,
    },
  });
  revalidatePath(`/Home/Compliance/posh/${complaintId}`);
}

async function setStatus(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const id = String(form.get("id"));
  const status = String(form.get("status"));
  const closingNote = String(form.get("closingNote") ?? "") || null;
  const recommendation = String(form.get("recommendation") ?? "") || null;
  const actionTaken = String(form.get("actionTaken") ?? "") || null;
  const data: any = { status };
  if (["RESOLVED","DISMISSED","WITHDRAWN"].includes(status)) data.closedAt = new Date();
  if (closingNote) data.closingNote = closingNote;
  if (recommendation) data.recommendation = recommendation;
  if (actionTaken) data.actionTaken = actionTaken;
  await prisma.poshComplaint.updateMany({
    where: { id, schoolId: u.schoolId },
    data,
  });
  revalidatePath(`/Home/Compliance/posh/${id}`);
}

export const dynamic = "force-dynamic";

export default async function PoshDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER"]);
  const { id } = await params;
  const c = await prisma.poshComplaint.findFirst({
    where: { id, schoolId: u.schoolId },
    include: { hearings: { orderBy: { scheduledAt: "asc" } } },
  });
  if (!c) notFound();

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <Link href="/Home/Compliance/posh" className="text-xs text-brand-700 hover:underline">← Back to register</Link>
      <h1 className="h-page mt-1 mb-1">{c.caseNo}</h1>
      <p className="muted mb-3">
        Filed {new Date(c.filedAt).toLocaleDateString("en-IN")} · status {c.status}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <div className="card card-pad">
          <div className="text-xs text-slate-500">Complainant</div>
          <div className="font-medium">{c.complainantName}</div>
          {c.complainantRole && <div className="text-xs text-slate-500">{c.complainantRole}</div>}
        </div>
        <div className="card card-pad">
          <div className="text-xs text-slate-500">Respondent</div>
          <div className="font-medium">{c.respondentName}</div>
          {c.respondentRole && <div className="text-xs text-slate-500">{c.respondentRole}</div>}
        </div>
      </div>

      <div className="card card-pad mb-5">
        <div className="text-xs text-slate-500 mb-1">Nature of incident</div>
        <p className="text-sm whitespace-pre-wrap">{c.natureOfIncident}</p>
        {c.incidentDate && (
          <div className="text-xs text-slate-500 mt-2">
            Incident on {new Date(c.incidentDate).toLocaleDateString("en-IN")}
            {c.incidentLocation ? ` · ${c.incidentLocation}` : ""}
          </div>
        )}
        {c.evidenceUrl && (
          <a href={c.evidenceUrl} target="_blank" className="text-brand-700 text-xs hover:underline mt-1 inline-block">
            View evidence →
          </a>
        )}
      </div>

      <h2 className="h-section mb-2">IC hearings ({c.hearings.length})</h2>
      <details className="card card-pad mb-3">
        <summary className="cursor-pointer font-medium">+ Add hearing</summary>
        <form action={addHearing} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end mt-3">
          <input type="hidden" name="complaintId" value={c.id} />
          <div>
            <label className="label">Scheduled at *</label>
            <input required type="datetime-local" name="scheduledAt" className="input" />
          </div>
          <div>
            <label className="label">Attendees</label>
            <input name="attendees" className="input" placeholder="ICOC members + parties" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Notes</label>
            <textarea name="notes" rows={3} className="input" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Outcome</label>
            <input name="outcome" className="input" />
          </div>
          <button type="submit" className="btn-primary md:col-span-2">Save hearing</button>
        </form>
      </details>

      {c.hearings.length > 0 && (
        <ul className="card divide-y divide-slate-100 mb-5">
          {c.hearings.map((h) => (
            <li key={h.id} className="px-4 py-3">
              <div className="flex items-start justify-between text-sm">
                <div>
                  <div className="font-medium">{new Date(h.scheduledAt).toLocaleString("en-IN")}</div>
                  {h.attendees && <div className="text-xs text-slate-500">{h.attendees}</div>}
                </div>
              </div>
              {h.notes && <div className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{h.notes}</div>}
              {h.outcome && <div className="text-sm text-emerald-700 mt-2"><strong>Outcome:</strong> {h.outcome}</div>}
            </li>
          ))}
        </ul>
      )}

      <details className="card card-pad" open={c.status === "UNDER_INQUIRY"}>
        <summary className="cursor-pointer font-medium">Update case status</summary>
        <form action={setStatus} className="grid grid-cols-1 gap-3 items-end mt-3">
          <input type="hidden" name="id" value={c.id} />
          <div>
            <label className="label">Status</label>
            <select name="status" className="input" defaultValue={c.status}>
              <option>FILED</option><option>UNDER_INQUIRY</option>
              <option>RESOLVED</option><option>DISMISSED</option><option>WITHDRAWN</option>
            </select>
          </div>
          <div>
            <label className="label">ICOC recommendation</label>
            <textarea name="recommendation" defaultValue={c.recommendation ?? ""} rows={3} className="input" />
          </div>
          <div>
            <label className="label">Action taken by school</label>
            <textarea name="actionTaken" defaultValue={c.actionTaken ?? ""} rows={3} className="input" />
          </div>
          <div>
            <label className="label">Closing note</label>
            <input name="closingNote" defaultValue={c.closingNote ?? ""} className="input" />
          </div>
          <button type="submit" className="btn-primary">Save</button>
        </form>
      </details>
    </div>
  );
}
