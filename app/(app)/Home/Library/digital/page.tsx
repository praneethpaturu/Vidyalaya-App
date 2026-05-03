import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function uploadDigital(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const title = String(form.get("title") ?? "").trim();
  const url = String(form.get("url") ?? "").trim();
  const type = String(form.get("type") ?? "LINK");
  if (!title || !url) return;
  await prisma.contentItem.create({
    data: {
      schoolId: u.schoolId,
      classId: (String(form.get("classId") ?? "") || null) as any,
      subjectId: (String(form.get("subjectId") ?? "") || null) as any,
      title, url, type,
      chapter: String(form.get("chapter") ?? "") || null,
      topic: String(form.get("topic") ?? "") || null,
      status: "PUBLISHED",
    },
  });
  revalidatePath("/Home/Library/digital");
  redirect("/Home/Library/digital?added=1");
}

export const dynamic = "force-dynamic";

export default async function DigitalLibraryPage({
  searchParams,
}: { searchParams: Promise<{ added?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const sp = await searchParams;
  const [items, classes, subjects] = await Promise.all([
    prisma.contentItem.findMany({
      where: { schoolId: u.schoolId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.class.findMany({
      where: { schoolId: u.schoolId },
      orderBy: [{ grade: "asc" }, { section: "asc" }],
    }),
    prisma.subject.findMany({ where: { schoolId: u.schoolId }, orderBy: { name: "asc" } }),
  ]);
  const classMap = new Map(classes.map((c) => [c.id, c.name]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-1">Digital Library</h1>
      <p className="muted mb-4">PDFs, EPUBs, videos, links — accessible by class/section/role.</p>
      {sp.added && <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Resource added.</div>}

      <section className="card card-pad mb-6">
        <h2 className="h-section mb-3">Add resource</h2>
        <form action={uploadDigital} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="label">Title *</label>
            <input required name="title" className="input" placeholder="NCERT Class 6 Mathematics" />
          </div>
          <div>
            <label className="label">Type</label>
            <select name="type" className="input" defaultValue="LINK">
              <option>LINK</option><option>PDF</option><option>VIDEO</option><option>DOC</option><option>EBOOK</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="label">URL *</label>
            <input required name="url" className="input" placeholder="https://… or /uploads/…" type="url" />
          </div>
          <div>
            <label className="label">Class</label>
            <select name="classId" className="input" defaultValue="">
              <option value="">Any</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Subject</label>
            <select name="subjectId" className="input" defaultValue="">
              <option value="">Any</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Chapter</label>
            <input name="chapter" className="input" placeholder="e.g. Algebra" />
          </div>
          <button type="submit" className="btn-primary md:col-span-3">Add resource</button>
        </form>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.length === 0 && (
          <div className="text-sm text-slate-500 col-span-full">No resources yet.</div>
        )}
        {items.map((it) => (
          <div key={it.id} className="card card-pad">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wide font-semibold text-brand-700">{it.type}</div>
              <div className="text-[10px] text-slate-500">{it.status}</div>
            </div>
            <div className="text-base font-medium leading-tight mt-1 line-clamp-2">{it.title}</div>
            <div className="text-xs text-slate-500 mt-1">
              {it.subjectId ? subjectMap.get(it.subjectId) : "—"} · {it.classId ? classMap.get(it.classId) : "All classes"}
            </div>
            <div className="flex gap-1 mt-3">
              <a target="_blank" rel="noopener" href={it.url} className="btn-tonal text-xs px-3 py-1">Open</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
