import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function postReflection(form: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  const sId = (session.user as any).schoolId;
  await prisma.reflection.create({
    data: {
      schoolId: sId,
      authorId: (session.user as any).id,
      authorRole: (session.user as any).role,
      title: String(form.get("title") ?? "") || null,
      body: String(form.get("body")),
      mood: String(form.get("mood") ?? "") || null,
    },
  });
  revalidatePath("/LMS/Reflections");
}

export default async function ReflectionsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const list = await prisma.reflection.findMany({
    where: { schoolId: sId }, orderBy: { createdAt: "desc" }, take: 30,
  });
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-3">Reflections</h1>
      <p className="muted mb-4">Student / teacher journal entries — mentor-visible, tracks mood and learning.</p>

      <form action={postReflection} className="card card-pad mb-5 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <select className="input col-span-1" name="mood">
            <option value="">— Mood —</option>
            <option value="HAPPY">😊 Happy</option>
            <option value="OK">😐 OK</option>
            <option value="TIRED">😩 Tired</option>
            <option value="ANXIOUS">😟 Anxious</option>
            <option value="EXCITED">🤩 Excited</option>
          </select>
          <input className="input col-span-2" name="title" placeholder="Title (optional)" />
        </div>
        <textarea required name="body" className="input" placeholder="Write your reflection…" rows={3} />
        <div className="flex justify-end"><button className="btn-primary">Post</button></div>
      </form>

      <ul className="space-y-3">
        {list.length === 0 && <li className="text-center text-slate-500 text-sm">No reflections yet.</li>}
        {list.map((r) => (
          <li key={r.id} className="card card-pad">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="badge-slate">{r.authorRole}</span>
              {r.mood && <span className="badge-blue">{r.mood}</span>}
              <span>{new Date(r.createdAt).toLocaleString("en-IN")}</span>
            </div>
            {r.title && <div className="font-medium">{r.title}</div>}
            <div className="text-sm text-slate-700 whitespace-pre-wrap">{r.body}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
