import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function addSource(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  await prisma.enquirySource.create({
    data: {
      schoolId: u.schoolId,
      name,
      isDigitalCampaign: form.get("isDigitalCampaign") === "on",
      showAtBranchForm: form.get("showAtBranchForm") === "on",
      showAtOnlineForm: form.get("showAtOnlineForm") === "on",
    },
  }).catch(() => {});
  revalidatePath("/Home/Admissions/settings");
}

async function toggleSource(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  const cur = await prisma.enquirySource.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!cur) return;
  await prisma.enquirySource.update({ where: { id }, data: { active: !cur.active } });
  revalidatePath("/Home/Admissions/settings");
}

async function addStage(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  await prisma.enquiryStage.create({
    data: {
      schoolId: u.schoolId,
      name,
      level: Number(form.get("level") ?? 1),
      sequence: Number(form.get("sequence") ?? 0),
      isLeadCancel: form.get("isLeadCancel") === "on",
      dateCaptureEnabled: form.get("dateCaptureEnabled") === "on",
      parentVisitOrSchoolTour: form.get("parentVisitOrSchoolTour") === "on",
      parentStageId: (String(form.get("parentStageId") ?? "") || null) as any,
    },
  }).catch(() => {});
  revalidatePath("/Home/Admissions/settings");
}

async function toggleStage(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  const cur = await prisma.enquiryStage.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!cur) return;
  await prisma.enquiryStage.update({ where: { id }, data: { active: !cur.active } });
  revalidatePath("/Home/Admissions/settings");
}

export const dynamic = "force-dynamic";

export default async function AdmissionsSettingsPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const [sources, stages] = await Promise.all([
    prisma.enquirySource.findMany({ where: { schoolId: u.schoolId }, orderBy: { name: "asc" } }),
    prisma.enquiryStage.findMany({ where: { schoolId: u.schoolId }, orderBy: [{ level: "asc" }, { sequence: "asc" }] }),
  ]);
  const stageMap = new Map(stages.map((s) => [s.id, s.name]));

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-1">Admissions settings</h1>
      <p className="muted mb-5">Define your enquiry sources and stages. These appear on the enquiry form and funnel.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sources */}
        <section className="card">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="h-section">Enquiry sources</h2>
            <span className="text-xs text-slate-500">{sources.length} defined</span>
          </div>
          <form action={addSource} className="p-4 space-y-2 border-b border-slate-100">
            <div className="grid grid-cols-2 gap-2">
              <input className="input col-span-2" name="name" placeholder="Source name (e.g. Google Ads)" required />
              <label className="text-xs flex items-center gap-2"><input type="checkbox" name="isDigitalCampaign" /> Digital campaign</label>
              <label className="text-xs flex items-center gap-2"><input type="checkbox" name="showAtBranchForm" defaultChecked /> Show at branch form</label>
              <label className="text-xs flex items-center gap-2"><input type="checkbox" name="showAtOnlineForm" defaultChecked /> Show at online form</label>
            </div>
            <button type="submit" className="btn-primary w-full">Add source</button>
          </form>
          <ul className="divide-y divide-slate-100">
            {sources.length === 0 && <li className="px-4 py-6 text-sm text-slate-500 text-center">No sources yet.</li>}
            {sources.map((s) => (
              <li key={s.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <div>
                  <div className={`font-medium ${s.active ? "" : "text-slate-400 line-through"}`}>{s.name}</div>
                  <div className="text-xs text-slate-500">
                    {s.isDigitalCampaign && <span className="badge-blue mr-1">digital</span>}
                    {s.showAtBranchForm && <span className="badge-slate mr-1">branch</span>}
                    {s.showAtOnlineForm && <span className="badge-slate">online</span>}
                  </div>
                </div>
                <form action={toggleSource}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="text-xs text-brand-700 hover:underline" type="submit">{s.active ? "Disable" : "Enable"}</button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        {/* Stages */}
        <section className="card">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="h-section">Enquiry stages</h2>
            <span className="text-xs text-slate-500">{stages.length} defined</span>
          </div>
          <form action={addStage} className="p-4 space-y-2 border-b border-slate-100">
            <div className="grid grid-cols-2 gap-2">
              <input className="input col-span-2" name="name" placeholder="Stage name (e.g. Counselling)" required />
              <input className="input" name="level" type="number" min={1} max={3} defaultValue={1} placeholder="Level" />
              <input className="input" name="sequence" type="number" defaultValue={0} placeholder="Sequence" />
              <select className="input col-span-2" name="parentStageId" defaultValue="">
                <option value="">No parent (top-level)</option>
                {stages.filter((s) => s.level < 3).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <label className="text-xs flex items-center gap-2"><input type="checkbox" name="isLeadCancel" /> Marks lead cancelled</label>
              <label className="text-xs flex items-center gap-2"><input type="checkbox" name="dateCaptureEnabled" /> Capture date on entry</label>
              <label className="text-xs flex items-center gap-2 col-span-2"><input type="checkbox" name="parentVisitOrSchoolTour" /> Parent visit / school tour</label>
            </div>
            <button type="submit" className="btn-primary w-full">Add stage</button>
          </form>
          <ul className="divide-y divide-slate-100">
            {stages.length === 0 && <li className="px-4 py-6 text-sm text-slate-500 text-center">No stages yet.</li>}
            {stages.map((s) => (
              <li key={s.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <div>
                  <div className={`font-medium ${s.active ? "" : "text-slate-400 line-through"}`}>
                    {s.parentStageId && <span className="text-slate-400">{stageMap.get(s.parentStageId)} › </span>}
                    {s.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    L{s.level} · seq {s.sequence}
                    {s.isLeadCancel && " · cancel"}
                    {s.dateCaptureEnabled && " · date"}
                    {s.parentVisitOrSchoolTour && " · tour"}
                  </div>
                </div>
                <form action={toggleStage}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="text-xs text-brand-700 hover:underline" type="submit">{s.active ? "Disable" : "Enable"}</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
