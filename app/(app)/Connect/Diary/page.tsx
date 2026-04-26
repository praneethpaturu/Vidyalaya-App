import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function postEntry(form: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  const sId = (session.user as any).schoolId;
  await prisma.diaryEntry.create({
    data: {
      schoolId: sId,
      classId: String(form.get("classId")),
      subjectId: String(form.get("subjectId") ?? "") || null,
      title: String(form.get("title")),
      body: String(form.get("body")),
      homework: String(form.get("homework") ?? "") || null,
      postedById: (session.user as any).id,
    },
  });
  revalidatePath("/Connect/Diary");
}

export default async function DiaryPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const [entries, classes, subjects] = await Promise.all([
    prisma.diaryEntry.findMany({ where: { schoolId: sId }, orderBy: { postedAt: "desc" }, take: 50 }),
    prisma.class.findMany({ where: { schoolId: sId } }),
    prisma.subject.findMany({ where: { schoolId: sId } }),
  ]);
  const cMap = new Map(classes.map((c) => [c.id, c]));
  const sMap = new Map(subjects.map((s) => [s.id, s]));
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-3">Diary</h1>
      <p className="muted mb-4">Daily class diary, homework, parent acknowledgement.</p>

      <form action={postEntry} className="card card-pad mb-5 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <select required className="input" name="classId">
            <option value="" disabled selected>Class</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input" name="subjectId">
            <option value="">— Subject (opt) —</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{cMap.get(s.classId)?.name} · {s.name}</option>)}
          </select>
        </div>
        <input required className="input" name="title" placeholder="Title (e.g. Today's lesson)" />
        <textarea required className="input" name="body" placeholder="What was taught today" rows={3} />
        <textarea className="input" name="homework" placeholder="Homework (optional)" rows={2} />
        <div className="flex justify-end"><button className="btn-primary">Post entry</button></div>
      </form>

      <ul className="space-y-3">
        {entries.length === 0 && <li className="text-center text-slate-500 text-sm">No diary entries yet.</li>}
        {entries.map((e) => (
          <li key={e.id} className="card card-pad">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="badge-blue">{cMap.get(e.classId)?.name ?? "—"}</span>
              {e.subjectId && <span className="badge-slate">{sMap.get(e.subjectId)?.name}</span>}
              <span>{new Date(e.postedAt).toLocaleString("en-IN")}</span>
            </div>
            <div className="font-medium">{e.title}</div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap mt-1">{e.body}</div>
            {e.homework && (
              <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                <div className="text-[10px] uppercase text-amber-700 font-semibold">Homework</div>
                {e.homework}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
