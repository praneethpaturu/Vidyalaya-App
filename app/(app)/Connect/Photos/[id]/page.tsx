import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import FileUploadInput from "@/components/FileUploadInput";
import BulkPhotoUpload from "./BulkPhotoUpload";

async function addPhoto(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const albumId = String(form.get("albumId"));
  const url = String(form.get("url") ?? "").trim();
  if (!url) return;
  const album = await prisma.photoAlbum.findFirst({ where: { id: albumId, schoolId: u.schoolId } });
  if (!album) return;
  await prisma.photo.create({
    data: {
      albumId,
      url,
      caption: String(form.get("caption") ?? "") || null,
    },
  });
  revalidatePath(`/Connect/Photos/${albumId}`);
  revalidatePath("/Connect/Photos");
}

async function deletePhoto(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const id = String(form.get("id"));
  const albumId = String(form.get("albumId"));
  await prisma.photo.deleteMany({
    where: { id, album: { schoolId: u.schoolId } },
  });
  revalidatePath(`/Connect/Photos/${albumId}`);
}

async function deleteAlbum(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  await prisma.photoAlbum.deleteMany({ where: { id, schoolId: u.schoolId } });
  revalidatePath("/Connect/Photos");
  redirect("/Connect/Photos");
}

export const dynamic = "force-dynamic";

export default async function AlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER", "PARENT", "STUDENT"]);
  const { id } = await params;
  const album = await prisma.photoAlbum.findFirst({
    where: { id, schoolId: u.schoolId },
    include: { photos: { orderBy: { uploadedAt: "desc" } } },
  });
  if (!album) notFound();

  const isStaff = u.role === "ADMIN" || u.role === "PRINCIPAL" || u.role === "TEACHER";

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <Link href="/Connect/Photos" className="text-xs text-brand-700 hover:underline">← Back to albums</Link>
      <div className="mt-1 mb-4 flex items-end justify-between">
        <div>
          <h1 className="h-page">{album.title}</h1>
          <p className="muted">
            {album.photos.length} photo{album.photos.length !== 1 ? "s" : ""}
            {album.description ? ` · ${album.description}` : ""}
            {" · audience: "}{album.audience}
          </p>
        </div>
        {isStaff && (
          <form action={deleteAlbum} className="inline">
            <input type="hidden" name="id" value={album.id} />
            <button className="btn-outline text-rose-700">Delete album</button>
          </form>
        )}
      </div>

      {isStaff && (
        <div className="card card-pad mb-5">
          <h2 className="h-section mb-3">Add photos</h2>
          <BulkPhotoUpload albumId={album.id} />

          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-slate-600">Or add a single photo with a caption</summary>
            <form action={addPhoto} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
              <input type="hidden" name="albumId" value={album.id} />
              <div className="md:col-span-2">
                <FileUploadInput name="url" accept="image/*" kind="PHOTO" ownerEntity="PhotoAlbum" ownerId={album.id} label="Upload single photo" />
              </div>
              <div>
                <label className="label">Caption</label>
                <input name="caption" className="input" />
              </div>
              <button type="submit" className="btn-primary md:col-span-3">Add photo</button>
            </form>
          </details>
        </div>
      )}

      {album.photos.length === 0 ? (
        <div className="card card-pad text-center text-sm text-slate-500 py-12">No photos yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {album.photos.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <div className="aspect-square bg-slate-100 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.caption ?? ""} className="absolute inset-0 w-full h-full object-cover" />
                {album.watermark && (
                  <div className="absolute bottom-1 right-2 text-[10px] bg-black/40 text-white px-1.5 py-0.5 rounded">
                    {album.title}
                  </div>
                )}
              </div>
              <div className="p-2 flex items-center justify-between text-xs">
                <span className="text-slate-600 truncate">{p.caption ?? ""}</span>
                {isStaff && (
                  <form action={deletePhoto} className="inline">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="albumId" value={album.id} />
                    <button className="text-rose-700 hover:underline">Delete</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
