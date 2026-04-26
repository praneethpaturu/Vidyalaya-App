import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function VisitorLogPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const visits = await prisma.visitor.findMany({
    where: { schoolId: sId },
    orderBy: { inAt: "desc" },
    take: 200,
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Visitor Log</h1>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Badge</th><th>Name</th><th>Phone</th><th>Purpose</th><th>Host</th><th>Vehicle</th><th>In</th><th>Out</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visits.length === 0 && (
              <tr><td colSpan={9} className="text-center text-slate-500 py-8">No Data Found</td></tr>
            )}
            {visits.map((v) => (
              <tr key={v.id}>
                <td className="font-mono text-xs">{v.badgeNo}</td>
                <td className="font-medium">{v.name}</td>
                <td className="font-mono text-xs">{v.phone ?? "—"}</td>
                <td>{v.purpose}</td>
                <td className="text-xs">{v.hostName ?? "—"}</td>
                <td className="text-xs">{v.vehicleNo ?? "—"}</td>
                <td className="text-xs">{new Date(v.inAt).toLocaleString("en-IN")}</td>
                <td className="text-xs">{v.outAt ? new Date(v.outAt).toLocaleString("en-IN") : "—"}</td>
                <td>{v.status === "IN" ? <span className="badge-amber">Inside</span> : <span className="badge-green">Out</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
