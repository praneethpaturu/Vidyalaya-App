import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Camera } from "lucide-react";

export default async function PhotosPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const albums = await prisma.photoAlbum.findMany({
    where: { schoolId: sId },
    include: { photos: { take: 4 }, _count: { select: { photos: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Photo Gallery</h1>
          <p className="muted">Albums per event/class with captions, watermark, parent visibility.</p>
        </div>
        <button className="btn-primary">+ New album</button>
      </div>

      {albums.length === 0 && (
        <div className="card card-pad text-center text-slate-500">No albums yet.</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {albums.map((a) => (
          <div key={a.id} className="card overflow-hidden">
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
          </div>
        ))}
      </div>
    </div>
  );
}
