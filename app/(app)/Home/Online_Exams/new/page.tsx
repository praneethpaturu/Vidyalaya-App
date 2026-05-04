import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function createExam(form: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  const sId = (session.user as any).schoolId;
  const startAt = new Date(String(form.get("startAt")));
  const durationMin = parseInt(String(form.get("durationMin") ?? "60"));
  const endAt = new Date(startAt.getTime() + durationMin * 60000);

  const exam = await prisma.onlineExam.create({
    data: {
      schoolId: sId,
      classId: String(form.get("classId")),
      subjectId: String(form.get("subjectId") ?? "") || null,
      title: String(form.get("title")),
      flavor: String(form.get("flavor") ?? "OBJECTIVE"),
      startAt,
      endAt,
      durationMin,
      totalMarks: parseInt(String(form.get("totalMarks") ?? "0")),
      passMarks: parseInt(String(form.get("passMarks") ?? "0")),
      negativeMark: parseFloat(String(form.get("negativeMark") ?? "0")),
      attempts: parseInt(String(form.get("attempts") ?? "1")),
      shuffle: form.get("shuffle") === "on",
      webcam: form.get("webcam") === "on",
      tabSwitchDetect: form.get("tabSwitchDetect") === "on",
      fullscreenLock: form.get("fullscreenLock") === "on",
      blockCopyPaste: form.get("blockCopyPaste") === "on",
      blockRightClick: form.get("blockRightClick") === "on",
      watermarkContent: form.get("watermarkContent") !== "off",
      ipMonitor: form.get("ipMonitor") !== "off",
      sectional: form.get("sectional") === "on",
      adaptive: form.get("adaptive") === "on",
      patternKey: String(form.get("patternKey") ?? "") || null,
      publishMode: String(form.get("publishMode") ?? "MANUAL"),
      publishResultMode: String(form.get("publishResultMode") ?? "AFTER_GRADING"),
      status: "DRAFT",
    },
  });
  redirect(`/Home/Online_Exams/${exam.id}`);
}

export default async function NewOnlineExamPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const classes = await prisma.class.findMany({
    where: { schoolId: sId },
    include: { subjects: true },
    orderBy: [{ grade: "asc" }, { section: "asc" }],
  });
  const patterns = await prisma.examPattern.findMany({
    where: { OR: [{ schoolId: null }, { schoolId: sId }], active: true },
    orderBy: { name: "asc" },
  });
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-3">+ New Online Exam</h1>
      <form action={createExam} className="card card-pad space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Title *</label><input required className="input" name="title" /></div>
          <div>
            <label className="label">Flavor *</label>
            <select required className="input" name="flavor">
              <option value="OBJECTIVE">Objective</option>
              <option value="DESCRIPTIVE">Descriptive</option>
              <option value="WORKSHEET">Worksheet</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Class *</label>
            <select required className="input" name="classId">
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">Subject (opt)</label>
            <select className="input" name="subjectId">
              <option value="">—</option>
              {classes.flatMap((c) => c.subjects.map((s) => <option key={s.id} value={s.id}>{c.name} · {s.name}</option>))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Start *</label><input required type="datetime-local" className="input" name="startAt" /></div>
          <div><label className="label">Duration (min) *</label><input required type="number" className="input" name="durationMin" defaultValue={60} /></div>
          <div><label className="label">Attempts</label><input type="number" className="input" name="attempts" defaultValue={1} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Total marks *</label><input required type="number" className="input" name="totalMarks" defaultValue={50} /></div>
          <div><label className="label">Pass marks</label><input type="number" className="input" name="passMarks" defaultValue={20} /></div>
          <div><label className="label">Negative mark</label><input type="number" step="0.25" className="input" name="negativeMark" defaultValue={0} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Result publish</label>
            <select name="publishMode" className="input">
              <option value="MANUAL">Manual</option>
              <option value="IMMEDIATE">Immediate</option>
            </select>
          </div>
          <div>
            <label className="label">Parent visibility</label>
            <select name="publishResultMode" className="input">
              <option value="AFTER_GRADING">After grading is complete</option>
              <option value="IMMEDIATE">Immediately on submit</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Pattern preset (optional)</label>
          <select name="patternKey" className="input">
            <option value="">None — custom paper</option>
            {patterns.map((p) => <option key={p.key} value={p.key}>{p.name} — {p.description}</option>)}
          </select>
        </div>

        <fieldset className="border border-slate-200 rounded-lg p-3">
          <legend className="text-xs font-medium text-slate-600 px-2">Integrity & proctoring</legend>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="flex gap-1.5"><input type="checkbox" name="shuffle" defaultChecked /> Shuffle questions & options (per student)</label>
            <label className="flex gap-1.5"><input type="checkbox" name="webcam" /> Webcam proctoring</label>
            <label className="flex gap-1.5"><input type="checkbox" name="tabSwitchDetect" defaultChecked /> Tab-switch detection</label>
            <label className="flex gap-1.5"><input type="checkbox" name="fullscreenLock" /> Force full-screen mode</label>
            <label className="flex gap-1.5"><input type="checkbox" name="blockCopyPaste" /> Block copy / paste / printscreen</label>
            <label className="flex gap-1.5"><input type="checkbox" name="blockRightClick" /> Block right-click menu</label>
            <label className="flex gap-1.5"><input type="checkbox" name="watermarkContent" defaultChecked /> Watermark content with student ID</label>
            <label className="flex gap-1.5"><input type="checkbox" name="ipMonitor" defaultChecked /> Capture client IP per save</label>
          </div>
        </fieldset>

        <fieldset className="border border-slate-200 rounded-lg p-3">
          <legend className="text-xs font-medium text-slate-600 px-2">Advanced</legend>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="flex gap-1.5"><input type="checkbox" name="sectional" /> Sectional — submit each section separately</label>
            <label className="flex gap-1.5"><input type="checkbox" name="adaptive" /> Adaptive testing (CAT)</label>
          </div>
        </fieldset>
        <div className="flex justify-end gap-2">
          <a href="/Home/Online_Exams" className="btn-outline">Cancel</a>
          <button className="btn-primary">Save Draft</button>
        </div>
      </form>
    </div>
  );
}
