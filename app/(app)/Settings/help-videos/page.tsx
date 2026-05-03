import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function addVideo(form: FormData) {
  "use server";
  await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const title = String(form.get("title") ?? "").trim();
  const videoUrl = String(form.get("videoUrl") ?? "").trim();
  const module = String(form.get("module") ?? "").trim();
  if (!title || !videoUrl || !module) return;
  await prisma.helpVideo.create({
    data: {
      module,
      title,
      videoUrl,
      description: String(form.get("description") ?? "") || null,
      thumbnailUrl: String(form.get("thumbnailUrl") ?? "") || null,
      durationSec: Number(form.get("durationSec") ?? 0),
      sequence: Number(form.get("sequence") ?? 0),
      posterColor: String(form.get("posterColor") ?? "brand"),
    },
  });
  revalidatePath("/Settings/help-videos");
  revalidatePath("/support/help");
  redirect("/Settings/help-videos?added=1");
}

async function update(form: FormData) {
  "use server";
  await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  await prisma.helpVideo.update({
    where: { id },
    data: {
      title: String(form.get("title") ?? ""),
      module: String(form.get("module") ?? ""),
      videoUrl: String(form.get("videoUrl") ?? ""),
      description: String(form.get("description") ?? "") || null,
      thumbnailUrl: String(form.get("thumbnailUrl") ?? "") || null,
      durationSec: Number(form.get("durationSec") ?? 0),
      sequence: Number(form.get("sequence") ?? 0),
    },
  });
  revalidatePath("/Settings/help-videos");
  revalidatePath("/support/help");
}

async function toggle(form: FormData) {
  "use server";
  await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  const v = await prisma.helpVideo.findUnique({ where: { id } });
  if (!v) return;
  await prisma.helpVideo.update({ where: { id }, data: { active: !v.active } });
  revalidatePath("/Settings/help-videos");
  revalidatePath("/support/help");
}

async function deleteVideo(form: FormData) {
  "use server";
  await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  await prisma.helpVideo.delete({ where: { id } });
  revalidatePath("/Settings/help-videos");
  revalidatePath("/support/help");
}

export const dynamic = "force-dynamic";

const MODULES = [
  "Admissions", "SIS", "HR", "Finance", "Library", "Hostel", "Transport",
  "Online Exams", "Reports", "Connect", "Settings", "Compliance", "Visitor Mgmt",
  "Wellness", "Alumni", "AI", "AddOns",
];

export default async function HelpVideosAdminPage({
  searchParams,
}: { searchParams: Promise<{ added?: string }> }) {
  await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sp = await searchParams;
  const videos = await prisma.helpVideo.findMany({
    orderBy: [{ module: "asc" }, { sequence: "asc" }],
  });

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <Link href="/support/help" className="text-xs text-brand-700 hover:underline">← Back to library</Link>
      <h1 className="h-page mt-1 mb-1">Manage help video library</h1>
      <p className="muted mb-4">
        Self-hosted: paste a URL to your own MP4 (Vercel <span className="font-mono">/public</span>,
        Supabase Storage, S3, CloudFront — anywhere that serves <span className="font-mono">video/*</span>).
        Optional thumbnail.
      </p>

      {sp.added && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Video added.</div>}

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ Add video</summary>
        <form action={addVideo} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <div className="md:col-span-2"><label className="label">Title *</label><input required name="title" className="input" /></div>
          <div>
            <label className="label">Module *</label>
            <select required name="module" className="input" defaultValue="">
              <option value="">— Select —</option>
              {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="label">Video URL *</label>
            <input required type="url" name="videoUrl" className="input" placeholder="/videos/sis-promotion.mp4 or https://…/file.mp4" />
            <p className="text-xs text-slate-500 mt-1">
              Tip: drop the file in <span className="font-mono">public/videos/</span> in the repo and use a relative path,
              or paste a Supabase / S3 signed URL.
            </p>
          </div>
          <div>
            <label className="label">Duration (sec)</label>
            <input type="number" min={0} name="durationSec" defaultValue={0} className="input" />
          </div>
          <div>
            <label className="label">Sequence</label>
            <input type="number" name="sequence" defaultValue={0} className="input" />
          </div>
          <div>
            <label className="label">Poster colour</label>
            <select name="posterColor" defaultValue="brand" className="input">
              {["brand","blue","sky","emerald","amber","violet","rose","cyan","indigo","slate"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="label">Thumbnail URL</label>
            <input type="url" name="thumbnailUrl" className="input" placeholder="https://…/thumb.jpg" />
          </div>
          <div className="md:col-span-3">
            <label className="label">Description</label>
            <textarea name="description" rows={2} className="input" />
          </div>
          <button type="submit" className="btn-primary md:col-span-3">Add video</button>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Module</th><th>Title</th><th>URL</th><th>Duration</th><th>Seq</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {videos.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">No videos.</td></tr>}
            {videos.map((v) => (
              <tr key={v.id}>
                <td><span className="badge-blue text-xs">{v.module}</span></td>
                <td>
                  <details>
                    <summary className="font-medium cursor-pointer">{v.title}</summary>
                    <form action={update} className="grid grid-cols-2 gap-2 mt-3 p-3 bg-slate-50 rounded-lg">
                      <input type="hidden" name="id" value={v.id} />
                      <input name="title" defaultValue={v.title} className="input text-sm col-span-2" placeholder="Title" />
                      <select name="module" defaultValue={v.module} className="input text-sm">
                        {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input type="number" name="durationSec" defaultValue={v.durationSec} className="input text-sm" placeholder="Duration sec" />
                      <input name="videoUrl" defaultValue={v.videoUrl} className="input text-sm col-span-2" placeholder="Video URL" />
                      <input name="thumbnailUrl" defaultValue={v.thumbnailUrl ?? ""} className="input text-sm col-span-2" placeholder="Thumbnail URL" />
                      <input type="number" name="sequence" defaultValue={v.sequence} className="input text-sm" placeholder="Sequence" />
                      <textarea name="description" defaultValue={v.description ?? ""} rows={2} className="input text-sm col-span-2" placeholder="Description" />
                      <button type="submit" className="btn-primary text-xs col-span-2">Save</button>
                    </form>
                  </details>
                </td>
                <td className="font-mono text-xs max-w-xs truncate"><a href={v.videoUrl} target="_blank" className="text-brand-700 hover:underline">{v.videoUrl}</a></td>
                <td className="text-xs">{Math.floor(v.durationSec / 60)}:{String(v.durationSec % 60).padStart(2, "0")}</td>
                <td className="text-xs">{v.sequence}</td>
                <td>
                  <span className={v.active ? "badge-green" : "badge-slate"}>{v.active ? "Active" : "Hidden"}</span>
                </td>
                <td className="text-right whitespace-nowrap">
                  <form action={toggle} className="inline mr-2">
                    <input type="hidden" name="id" value={v.id} />
                    <button type="submit" className="text-xs text-brand-700 hover:underline">{v.active ? "Hide" : "Show"}</button>
                  </form>
                  <form action={deleteVideo} className="inline">
                    <input type="hidden" name="id" value={v.id} />
                    <button type="submit" className="text-xs text-rose-700 hover:underline">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
