import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function HostelOthersPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const outpasses = await prisma.outpass.findMany({
    where: { schoolId: sId }, orderBy: { fromAt: "desc" }, take: 20,
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Others</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <Card title="Asset Inventory" desc="Linens, furniture, fixtures" />
        <Card title="Maintenance Tickets" desc="Plumbing, electrical, AMC" />
        <Card title="Laundry Register" desc="Issue & return" />
      </div>

      <h2 className="h-section mb-2">Outpass Register</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Student</th><th>From</th><th>To</th><th>Reason</th><th>Status</th></tr></thead>
          <tbody>
            {outpasses.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-8">No outpass records.</td></tr>}
            {outpasses.map((o) => (
              <tr key={o.id}>
                <td className="font-mono text-xs">{o.studentId}</td>
                <td className="text-xs">{new Date(o.fromAt).toLocaleString("en-IN")}</td>
                <td className="text-xs">{new Date(o.toAt).toLocaleString("en-IN")}</td>
                <td>{o.reason}</td>
                <td>
                  <span className={
                    o.status === "APPROVED" ? "badge-green"
                      : o.status === "RETURNED" ? "badge-blue"
                      : o.status === "REJECTED" ? "badge-red"
                      : "badge-amber"
                  }>{o.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="card card-pad">
      <div className="font-medium">{title}</div>
      <div className="text-xs text-slate-500 mt-1">{desc}</div>
      <span className="inline-block mt-3 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Coming next</span>
    </div>
  );
}
