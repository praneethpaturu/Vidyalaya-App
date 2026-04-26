const ITEMS = [
  { title: "NCERT Class 6 Mathematics", type: "PDF", subject: "Mathematics", classes: "Grade VI", views: 245 },
  { title: "Periodic Table animation", type: "VIDEO", subject: "Chemistry", classes: "Grade IX-X", views: 132 },
  { title: "Tagore — Gitanjali", type: "EPUB", subject: "English", classes: "Grade IX+", views: 89 },
  { title: "Class 8 Civics — Constitution", type: "PDF", subject: "Civics", classes: "Grade VIII", views: 56 },
  { title: "Linear Algebra primer", type: "LINK", subject: "Mathematics", classes: "Grade XI", views: 203 },
  { title: "Cell Division — TED-Ed", type: "VIDEO", subject: "Biology", classes: "Grade IX-X", views: 178 },
];

export default function DigitalLibraryPage() {
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Digital Library</h1>
          <p className="muted">PDFs, EPUBs, videos, links — accessible by class/section/role.</p>
        </div>
        <button className="btn-primary">+ Upload</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ITEMS.map((it) => (
          <div key={it.title} className="card card-pad">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wide font-semibold text-brand-700">{it.type}</div>
              <div className="text-[10px] text-slate-500">{it.views} views</div>
            </div>
            <div className="text-base font-medium leading-tight mt-1 line-clamp-2">{it.title}</div>
            <div className="text-xs text-slate-500 mt-1">{it.subject} · {it.classes}</div>
            <div className="flex gap-1 mt-3">
              <button className="btn-tonal text-xs px-3 py-1">Open</button>
              <button className="btn-outline text-xs px-3 py-1">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
