import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Pin } from "lucide-react";

async function postNote(form: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  const sId = (session.user as any).schoolId;
  await prisma.wallPost.create({
    data: {
      schoolId: sId,
      authorId: (session.user as any).id,
      authorName: (session.user as any).name,
      audience: String(form.get("audience") ?? "STAFF"),
      body: String(form.get("body")),
    },
  });
  revalidatePath("/Connect/Wall");
}

export default async function WallPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const posts = await prisma.wallPost.findMany({
    where: { schoolId: sId },
    include: { _count: { select: { comments: true } } },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 30,
  });
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-3">Student / Staff Wall</h1>
      <p className="muted mb-4">Internal social feed. Posts can be pinned, flagged or moderated.</p>

      <form action={postNote} className="card card-pad mb-5 space-y-2">
        <select className="input w-32" name="audience">
          <option value="STAFF">Staff</option>
          <option value="STUDENTS">Students</option>
          <option value="ALL">All</option>
        </select>
        <textarea required className="input" name="body" placeholder="Share something with the school…" rows={3} />
        <div className="flex justify-end"><button className="btn-primary">Post</button></div>
      </form>

      <ul className="space-y-3">
        {posts.length === 0 && <li className="text-center text-slate-500 text-sm">No posts yet.</li>}
        {posts.map((p) => (
          <li key={p.id} className="card card-pad">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{p.authorName}</span>
              <span className="badge-slate">{p.audience}</span>
              {p.pinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
              <span className="ml-auto">{new Date(p.createdAt).toLocaleString("en-IN")}</span>
            </div>
            <div className="text-sm text-slate-800 whitespace-pre-wrap mt-1.5">{p.body}</div>
            <div className="text-xs text-slate-500 mt-2">{p._count.comments} comments</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
