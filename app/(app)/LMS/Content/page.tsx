import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ContentMgmtPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const items = await prisma.contentItem.findMany({
    where: { schoolId: sId }, orderBy: { createdAt: "desc" }, take: 50,
  });
  return (
    <div className="p-5 max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Content Management</h1>
          <p className="muted">Repository by Class/Subject/Chapter/Topic with versioning, approval (Draft/Submitted/Approved/Published).</p>
        </div>
        <button className="btn-primary">+ Upload</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Title</th><th>Type</th><th>Class</th><th>Chapter / Topic</th><th>Version</th><th>Status</th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No Data Found</td></tr>}
            {items.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.title}</td>
                <td><span className="badge-blue">{c.type}</span></td>
                <td className="font-mono text-xs">{c.classId ?? "—"}</td>
                <td className="text-xs">{c.chapter} / {c.topic}</td>
                <td>v{c.version}</td>
                <td>
                  <span className={
                    c.status === "PUBLISHED" ? "badge-green"
                      : c.status === "APPROVED" ? "badge-blue"
                      : c.status === "SUBMITTED" ? "badge-amber"
                      : "badge-slate"
                  }>{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
