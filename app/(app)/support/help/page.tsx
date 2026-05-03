import Link from "next/link";
import { Play, Settings as SettingsIcon } from "lucide-react";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

function fmtDuration(s: number): string {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export const dynamic = "force-dynamic";

export default async function HelpVideosPage({
  searchParams,
}: { searchParams: Promise<{ module?: string; v?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER", "TEACHER", "PARENT", "STUDENT", "TRANSPORT_MANAGER", "INVENTORY_MANAGER"]);
  const sp = await searchParams;
  const filter = sp.module ?? "";
  const isAdmin = u.role === "ADMIN" || u.role === "PRINCIPAL";

  const videos = await prisma.helpVideo.findMany({
    where: { active: true, ...(filter ? { module: filter } : {}) },
    orderBy: [{ module: "asc" }, { sequence: "asc" }],
  });
  const moduleRows = await prisma.helpVideo.findMany({
    where: { active: true }, distinct: ["module"], select: { module: true }, orderBy: { module: "asc" },
  });
  const active = sp.v ? videos.find((v) => v.id === sp.v) : null;

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <Link href="/support" className="text-xs text-brand-700 hover:underline">← Back to support</Link>
          <h1 className="h-page mt-1">Help videos</h1>
          <p className="muted">Tutorial library — short walkthroughs of every module.</p>
        </div>
        {isAdmin && (
          <Link href="/Settings/help-videos" className="btn-outline inline-flex items-center gap-1.5">
            <SettingsIcon className="w-4 h-4" /> Manage library
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Link href="/support/help" className={`text-xs px-3 py-1 rounded-full ${!filter ? "bg-brand-700 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>All</Link>
        {moduleRows.map((m) => (
          <Link key={m.module} href={`/support/help?module=${encodeURIComponent(m.module)}`}
            className={`text-xs px-3 py-1 rounded-full ${filter === m.module ? "bg-brand-700 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>
            {m.module}
          </Link>
        ))}
      </div>

      {active && (
        <section className="card mb-6 overflow-hidden">
          <div className="bg-slate-900 aspect-video">
            <video
              key={active.id}
              src={active.videoUrl}
              poster={active.thumbnailUrl ?? undefined}
              controls
              className="w-full h-full"
              preload="metadata"
            >
              Your browser does not support video playback.
            </video>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-brand-700">{active.module}</div>
              <div className="font-medium">{active.title}</div>
              {active.description && <div className="text-xs text-slate-600 mt-1 max-w-2xl">{active.description}</div>}
            </div>
            <div className="text-xs text-slate-500 whitespace-nowrap">{fmtDuration(active.durationSec)}</div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.length === 0 && (
          <div className="text-sm text-slate-500 col-span-full">No videos available yet.</div>
        )}
        {videos.map((v) => (
          <Link
            key={v.id}
            href={filter
              ? `/support/help?module=${encodeURIComponent(v.module)}&v=${v.id}`
              : `/support/help?v=${v.id}`}
            className="card overflow-hidden hover:shadow-cardHover transition group"
          >
            <div className="aspect-video relative bg-slate-100">
              {v.thumbnailUrl ? (
                <img src={v.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-brand-100 to-brand-200">
                  <div className="w-14 h-14 rounded-full bg-brand-700/90 text-white grid place-items-center shadow-sm">
                    <Play className="w-6 h-6" />
                  </div>
                </div>
              )}
              <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                {fmtDuration(v.durationSec)}
              </span>
            </div>
            <div className="px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-brand-700">{v.module}</div>
              <div className="font-medium leading-tight mt-0.5 group-hover:text-brand-700">{v.title}</div>
              {v.description && (
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{v.description}</div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
