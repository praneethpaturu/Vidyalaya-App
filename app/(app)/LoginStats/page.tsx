import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function LoginStatsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;

  const events = await prisma.loginEvent.findMany({
    where: { schoolId: sId },
    orderBy: { loggedAt: "desc" },
    take: 100,
  });

  const totalUsers = await prisma.user.count({ where: { schoolId: sId } });
  const distinct = await prisma.loginEvent.findMany({
    where: { schoolId: sId },
    select: { userId: true },
    distinct: ["userId"],
  });
  const everLogged = distinct.length;
  const neverLogged = totalUsers - everLogged;
  const failed = events.filter((e) => !e.success).length;

  // Day-by-day counts
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const buckets: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    buckets[d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })] = 0;
  }
  events.forEach((e) => {
    const k = new Date(e.loggedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    if (k in buckets) buckets[k]++;
  });

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Login Statistics</h1>
      <p className="muted mb-4">Login counts/timestamps per user/role, device/IP, failed-login alerts.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Tile label="Total users" value={totalUsers} />
        <Tile label="Logged in (ever)" value={everLogged} />
        <Tile label="Never logged in" value={neverLogged} />
        <Tile label="Failed (recent)" value={failed} />
      </div>

      <div className="card mb-5">
        <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">Last 7 days</div>
        <div className="p-4 grid grid-cols-7 gap-2 items-end h-40">
          {Object.entries(buckets).map(([d, n]) => {
            const max = Math.max(...Object.values(buckets), 1);
            return (
              <div key={d} className="flex flex-col items-center justify-end h-full">
                <div className="w-full bg-brand-500 rounded-t" style={{ height: `${Math.max(2, (n / max) * 100)}%` }} title={`${n}`} />
                <div className="text-[10px] text-slate-500 mt-1">{d}</div>
              </div>
            );
          })}
        </div>
      </div>

      <h2 className="h-section mb-2">Recent events</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>When</th><th>Email</th><th>Success</th><th>Device</th><th>IP</th></tr></thead>
          <tbody>
            {events.length === 0 && <tr><td colSpan={5} className="text-center text-slate-500 py-6">No login events.</td></tr>}
            {events.slice(0, 50).map((e) => (
              <tr key={e.id}>
                <td className="text-xs">{new Date(e.loggedAt).toLocaleString("en-IN")}</td>
                <td className="font-mono text-xs">{e.email}</td>
                <td>{e.success ? <span className="badge-green">OK</span> : <span className="badge-red">Failed</span>}</td>
                <td className="text-xs">{e.device ?? "—"}</td>
                <td className="font-mono text-xs">{e.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: any }) {
  return (
    <div className="card card-pad">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-2xl font-medium tracking-tight">{value}</div>
    </div>
  );
}
