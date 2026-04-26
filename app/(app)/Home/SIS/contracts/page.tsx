import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ContractsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const invoices = await prisma.invoice.findMany({
    where: { schoolId: sId },
    include: { student: { include: { user: true, class: true } } },
    take: 50,
    orderBy: { issueDate: "desc" },
  });
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Student Contracts</h1>
      <p className="muted mb-4">Fee/service contracts per student per academic year.</p>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th><th>Class</th><th>Contract #</th><th>From</th><th>To</th><th className="text-right">Amount</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr><td colSpan={7} className="text-center text-slate-500 py-8">No Data Found</td></tr>
            )}
            {invoices.map((i) => (
              <tr key={i.id}>
                <td className="font-medium">{i.student.user.name}</td>
                <td>{i.student.class?.name ?? "—"}</td>
                <td className="font-mono text-xs">{i.number}</td>
                <td className="text-xs">{new Date(i.issueDate).toLocaleDateString("en-IN")}</td>
                <td className="text-xs">{new Date(i.dueDate).toLocaleDateString("en-IN")}</td>
                <td className="text-right">₹{(i.total / 100).toLocaleString("en-IN")}</td>
                <td><span className="badge-blue">{i.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
