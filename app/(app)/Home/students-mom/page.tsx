import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import HomePageTabs from "@/components/HomePageTabs";

export default async function StudentsMoMPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  // Compute month-on-month student count using created users tied to students.
  const students = await prisma.student.findMany({
    where: { schoolId: sId },
    include: { user: { select: { createdAt: true } } },
  });
  const now = new Date();
  const months: { label: string; count: number; net: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const count = students.filter((s) => s.user.createdAt < next).length;
    const net = students.filter((s) => s.user.createdAt >= d && s.user.createdAt < next).length;
    months.push({ label: d.toLocaleString("en-IN", { month: "short", year: "2-digit" }), count, net });
  }
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <HomePageTabs />
      <h1 className="h-page text-slate-700 mb-3">Students Month-on-Month</h1>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Month</th><th className="text-right">Cumulative</th><th className="text-right">Net Add</th></tr></thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.label}>
                <td>{m.label}</td>
                <td className="text-right font-medium">{m.count}</td>
                <td className="text-right">{m.net >= 0 ? `+${m.net}` : m.net}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
