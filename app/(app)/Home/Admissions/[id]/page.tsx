import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ADMISSION_STAGES, STAGE_LABEL, STAGE_COLOR, nextStages, type AdmissionStage } from "@/lib/admissions";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

async function advanceStage(form: FormData) {
  "use server";
  const id = String(form.get("id"));
  const next = String(form.get("next"));
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  await prisma.admissionEnquiry.update({
    where: { id },
    data: { status: next, ...(next === "LOST" ? { lostReason: String(form.get("reason") ?? "") } : {}) },
  });
  await prisma.enquiryInteraction.create({
    data: {
      enquiryId: id,
      type: "NOTE",
      summary: `Stage advanced to ${next}`,
      byUserId: (session.user as any).id,
    },
  });
  revalidatePath(`/Home/Admissions/${id}`);
}

async function addInteraction(form: FormData) {
  "use server";
  const id = String(form.get("id"));
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  await prisma.enquiryInteraction.create({
    data: {
      enquiryId: id,
      type: String(form.get("type")),
      summary: String(form.get("summary")),
      byUserId: (session.user as any).id,
    },
  });
  revalidatePath(`/Home/Admissions/${id}`);
}

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await prisma.admissionEnquiry.findUnique({
    where: { id },
    include: { interactions: { orderBy: { createdAt: "desc" } } },
  });
  if (!e) notFound();
  const stages = nextStages(e.status as AdmissionStage);

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <a href="/Home/Admissions" className="text-xs text-brand-700 hover:underline">← Back to enquiries</a>
      <div className="flex items-end justify-between mt-1 mb-4">
        <div>
          <h1 className="h-page">{e.childName}</h1>
          <p className="muted">{e.expectedGrade} · {e.parentName} · {e.parentPhone}</p>
        </div>
        <span className={`badge ${STAGE_COLOR[e.status as AdmissionStage] ?? "bg-slate-100"}`}>{STAGE_LABEL[e.status as AdmissionStage] ?? e.status}</span>
      </div>

      {/* Funnel timeline */}
      <div className="card card-pad mb-4">
        <div className="flex items-center justify-between gap-1 overflow-x-auto">
          {ADMISSION_STAGES.filter((s) => s !== "LOST").map((s, i) => {
            const reached = ADMISSION_STAGES.indexOf(e.status as AdmissionStage) >= i;
            return (
              <div key={s} className="flex flex-col items-center min-w-[78px]">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${reached ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {i + 1}
                </div>
                <div className="text-[10px] text-slate-600 mt-1 text-center">{STAGE_LABEL[s]}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card card-pad lg:col-span-2">
          <h2 className="h-section mb-2">Details</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <Field label="Child gender" value={e.childGender ?? "—"} />
            <Field label="Source" value={e.source} />
            <Field label="Sub-source" value={e.subSource ?? "—"} />
            <Field label="Campaign" value={e.campaign ?? "—"} />
            <Field label="Preferred branch" value={e.preferredBranch ?? "Main"} />
            <Field label="Email" value={e.parentEmail ?? "—"} />
            <Field label="Application fee" value={`₹${(e.applicationFee / 100).toLocaleString("en-IN")} ${e.feePaid ? "· Paid" : "· Unpaid"}`} />
            <Field label="Lost reason" value={e.lostReason ?? "—"} />
          </dl>
          {e.notes && <p className="text-sm text-slate-700 mt-3 p-3 rounded-lg bg-slate-50 whitespace-pre-wrap">{e.notes}</p>}
        </div>

        <div className="card card-pad">
          <h2 className="h-section mb-2">Advance stage</h2>
          {stages.length === 0 ? (
            <p className="text-sm text-slate-500">This enquiry has reached a terminal stage.</p>
          ) : (
            <form action={advanceStage} className="space-y-2">
              <input type="hidden" name="id" value={e.id} />
              <select className="input" name="next" defaultValue={stages[0]}>
                {stages.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
              </select>
              <input className="input" name="reason" placeholder="Reason (if marking Lost)" />
              <button className="btn-primary w-full" type="submit">Save</button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="card card-pad">
          <h2 className="h-section mb-2">Add interaction</h2>
          <form action={addInteraction} className="space-y-2">
            <input type="hidden" name="id" value={e.id} />
            <select className="input" name="type">
              <option value="CALL">Call</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="VISIT">Visit</option>
              <option value="NOTE">Note</option>
            </select>
            <textarea name="summary" required className="input" placeholder="Summary…" rows={2} />
            <button className="btn-tonal w-full" type="submit">Log interaction</button>
          </form>
        </div>
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">Interaction log</div>
          <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {e.interactions.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">No interactions logged.</li>}
            {e.interactions.map((it) => (
              <li key={it.id} className="px-4 py-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="badge-blue">{it.type}</span>
                  <span>{new Date(it.createdAt).toLocaleString("en-IN")}</span>
                </div>
                <p className="text-sm text-slate-800 mt-1">{it.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
    </>
  );
}
