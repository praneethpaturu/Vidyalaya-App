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
      publishMode: String(form.get("publishMode") ?? "MANUAL"),
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
        <div>
          <label className="label">Result publish</label>
          <select name="publishMode" className="input">
            <option value="MANUAL">Manual</option>
            <option value="IMMEDIATE">Immediate</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex gap-1.5"><input type="checkbox" name="shuffle" defaultChecked /> Shuffle questions/options</label>
          <label className="flex gap-1.5"><input type="checkbox" name="webcam" /> Webcam proctoring</label>
          <label className="flex gap-1.5"><input type="checkbox" name="tabSwitchDetect" /> Tab-switch detection</label>
        </div>
        <div className="flex justify-end gap-2">
          <a href="/Home/Online_Exams" className="btn-outline">Cancel</a>
          <button className="btn-primary">Save Draft</button>
        </div>
      </form>
    </div>
  );
}
