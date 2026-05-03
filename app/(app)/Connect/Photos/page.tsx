import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Camera } from "lucide-react";

async function addAlbum(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const title = String(form.get("title") ?? "").trim();
  if (!title) return;
  await prisma.photoAlbum.create({
    data: {
      schoolId: u.schoolId, title,
      description: String(form.get("description") ?? "") || null,
      audience: String(form.get("audience") ?? "ALL"),
      watermark: form.get("watermark") === "on",
      downloadAllowed: form.get("downloadAllowed") === "on",
    },
  });
  revalidatePath("/Connect/Photos");
  redirect("/Connect/Photos?added=1");
}

export const dynamic = "force-dynamic";

export default async function PhotosPage({
  searchParams,
}: { searchParams: Promise<{ added?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const sp = await searchParams;
  const albums = await prisma.photoAlbum.findMany({
    where: { schoolId: u.schoolId },
    include: { photos: { take: 4 }, _count: { select: { photos: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-1">Photo Gallery</h1>
      <p className="muted mb-3">Albums per event/class with captions, watermark, parent visibility.</p>
      {sp.added && <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Album created.</div>}

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ New album</summary>
        <form action={addAlbum} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <div className="md:col-span-2">
            <label className="label">Title *</label>
            <input required name="title" className="input" placeholder="Annual Day 2026" />
          </div>
          <div>
            <label className="label">Audience</label>
            <select name="audience" className="input" defaultValue="ALL">
              <option>ALL</option><option>CLASS</option><option>PARENTS</option><option>STAFF</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="label">Description</label>
            <input name="description" className="input" />
          </div>
          <label className="text-sm flex items-center gap-2 md:col-span-2">
            <input type="checkbox" name="watermark" defaultChecked /> Watermark photos
          </label>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" name="downloadAllowed" /> Allow downloads
          </label>
          <button type="submit" className="btn-primary md:col-span-3">Create album</button>
        </form>
      </details>

      {albums.length === 0 && (
        <div className="card card-pad text-center text-slate-500">No albums yet.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {albums.map((a) => (
          <a key={a.id} href={`/Connect/Photos/${a.id}`} className="card overflow-hidden hover:shadow-cardHover transition">
            <div className="grid grid-cols-2 gap-0.5 bg-slate-100 h-40">
              {a.photos.length === 0 && (
                <div className="col-span-2 flex items-center justify-center bg-slate-100">
                  <Camera className="w-8 h-8 text-slate-300" />
                </div>
              )}
              {a.photos.slice(0, 4).map((p) => (
                <div key={p.id} className="bg-cover bg-center" style={{ backgroundImage: `url(${p.url})` }} />
              ))}
            </div>
            <div className="p-3">
              <div className="font-medium">{a.title}</div>
              <div className="text-xs text-slate-500">{a._count.photos} photos · {a.audience}</div>
              <div className="text-[10px] text-slate-400 mt-1">{a.watermark ? "Watermarked" : "No watermark"} · {a.downloadAllowed ? "Download allowed" : "View only"}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
