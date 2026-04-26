import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function VisitorReportsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const visits = await prisma.visitor.findMany({
    where: { schoolId: sId, inAt: { gte: new Date(Date.now() - 30 * 86400000) } },
    select: { purpose: true, hostName: true, inAt: true, outAt: true },
  });

  const byPurpose: Record<string, number> = {};
  visits.forEach((v) => byPurpose[v.purpose] = (byPurpose[v.purpose] ?? 0) + 1);
  const byHost: Record<string, number> = {};
  visits.forEach((v) => { const h = v.hostName ?? "—"; byHost[h] = (byHost[h] ?? 0) + 1; });

  const totalDur = visits
    .filter((v) => v.outAt)
    .reduce((s, v) => s + (new Date(v.outAt!).getTime() - new Date(v.inAt).getTime()), 0);
  const completedCount = visits.filter((v) => v.outAt).length;
  const avgMinutes = completedCount > 0 ? Math.round(totalDur / 60000 / completedCount) : 0;

  const peakHourMap: Record<string, number> = {};
  visits.forEach((v) => {
    const hr = String(new Date(v.inAt).getHours()).padStart(2, "0") + ":00";
    peakHourMap[hr] = (peakHourMap[hr] ?? 0) + 1;
  });
  const peak = Object.entries(peakHourMap).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-4">Visitor Reports — last 30 days</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Tile label="Total visits" value={visits.length} />
        <Tile label="Avg. duration" value={`${avgMinutes} min`} />
        <Tile label="Peak hour" value={peak ? `${peak[0]} (${peak[1]})` : "—"} />
        <Tile label="Unique hosts" value={Object.keys(byHost).length} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ListCard title="By Purpose" items={byPurpose} />
        <ListCard title="By Host" items={byHost} />
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

function ListCard({ title, items }: { title: string; items: Record<string, number> }) {
  const entries = Object.entries(items).sort((a, b) => b[1] - a[1]);
  const max = entries.reduce((m, [, v]) => Math.max(m, v), 1);
  return (
    <div className="card">
      <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">{title}</div>
      <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
        {entries.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">No Data Found</li>}
        {entries.map(([k, v]) => (
          <li key={k} className="px-4 py-2.5 flex items-center gap-2">
            <div className="text-sm flex-1 truncate">{k}</div>
            <div className="w-32 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 bg-brand-600 rounded-full" style={{ width: `${(v / max) * 100}%` }} /></div>
            <div className="text-sm font-medium w-8 text-right">{v}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
