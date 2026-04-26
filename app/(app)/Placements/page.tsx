import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function PlacementsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const opps = await prisma.placementOpportunity.findMany({
    where: { schoolId: sId },
    include: { applications: true },
    orderBy: { createdAt: "desc" }, take: 50,
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Placements</h1>
          <p className="muted">Opportunity master, eligibility, applications, interview rounds, offers.</p>
        </div>
        <button className="btn-primary">+ New opportunity</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Title</th><th>Company</th><th>Location</th><th>Apply by</th><th>Apps</th><th>Status</th></tr></thead>
          <tbody>
            {opps.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No opportunities yet.</td></tr>}
            {opps.map((o) => (
              <tr key={o.id}>
                <td className="font-medium">{o.title}</td>
                <td>{o.company}</td>
                <td>{o.location ?? "—"}</td>
                <td className="text-xs">{o.applyBy ? new Date(o.applyBy).toLocaleDateString("en-IN") : "—"}</td>
                <td>{o.applications.length}</td>
                <td><span className={o.status === "OPEN" ? "badge-green" : "badge-slate"}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
