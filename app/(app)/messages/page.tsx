import { prisma } from "@/lib/db";
import { requirePageRole } from "@/lib/auth";
import { fmtDateTime } from "@/lib/utils";
import { Mail, MessageSquare, Bell, Smartphone, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { processOutboxAction } from "@/app/actions/messages";

export default async function MessagesOutboxPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const sId = u.schoolId;
  const rows = await prisma.messageOutbox.findMany({
    where: { schoolId: sId },
    orderBy: { queuedAt: "desc" },
    take: 200,
  });
  const counts = await prisma.messageOutbox.groupBy({ by: ["status"], where: { schoolId: sId }, _count: { _all: true } });
  const c = (s: string) => counts.find((x) => x.status === s)?._count._all ?? 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="h-page">Notifications outbox</h1>
          <p className="muted mt-1">Email · SMS · Push · In-app · {rows.length} most recent</p>
        </div>
        <form action={processOutboxAction}>
          <button className="btn-primary"><Loader2 className="w-4 h-4" /> Process queue</button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Tile icon={CheckCircle2} label="Sent" value={c("SENT")} tone="green" />
        <Tile icon={Loader2} label="Queued" value={c("QUEUED")} tone="blue" />
        <Tile icon={AlertTriangle} label="Failed" value={c("FAILED")} tone="red" />
        <Tile icon={Bell} label="Suppressed" value={c("SUPPRESSED")} tone="slate" />
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Channel</th><th>To</th><th>Subject / body</th><th>Template</th><th>Queued</th><th>Sent</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="cursor-pointer">
                <td>{channelIcon(r.channel)}</td>
                <td className="text-slate-700 max-w-[180px] truncate">{r.toEmail ?? r.toPhone ?? r.toUserId ?? "—"}</td>
                <td className="max-w-md">
                  <a href={`/messages/${r.id}`} className="block hover:text-brand-700">
                    <div className="text-sm font-medium truncate">{r.subject ?? "(no subject)"}</div>
                    <div className="text-xs text-slate-500 line-clamp-2">{r.body}</div>
                  </a>
                </td>
                <td>{r.template ? <span className="badge-slate">{r.template}</span> : "—"}</td>
                <td className="text-slate-600 whitespace-nowrap">{fmtDateTime(r.queuedAt)}</td>
                <td className="text-slate-600 whitespace-nowrap">{r.sentAt ? fmtDateTime(r.sentAt) : "—"}</td>
                <td>{statusBadge(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function channelIcon(ch: string) {
  if (ch === "EMAIL") return <span className="inline-flex items-center gap-1.5 text-sm"><Mail className="w-4 h-4 text-brand-700" />Email</span>;
  if (ch === "SMS")   return <span className="inline-flex items-center gap-1.5 text-sm"><MessageSquare className="w-4 h-4 text-emerald-700" />SMS</span>;
  if (ch === "PUSH")  return <span className="inline-flex items-center gap-1.5 text-sm"><Smartphone className="w-4 h-4 text-amber-700" />Push</span>;
  return <span className="inline-flex items-center gap-1.5 text-sm"><Bell className="w-4 h-4 text-slate-500" />In-app</span>;
}
function statusBadge(s: string) {
  if (s === "SENT") return <span className="badge-green">Sent</span>;
  if (s === "FAILED") return <span className="badge-red">Failed</span>;
  if (s === "QUEUED") return <span className="badge-amber">Queued</span>;
  return <span className="badge-slate">{s}</span>;
}
function Tile({ icon: Icon, label, value, tone }: any) {
  const t = tone === "green" ? "text-emerald-700" : tone === "red" ? "text-rose-700" : tone === "blue" ? "text-brand-700" : "text-slate-700";
  return (
    <div className="card card-pad">
      <div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${t}`} /><div className="text-xs text-slate-500">{label}</div></div>
      <div className={`kpi-num mt-1 ${t}`}>{value}</div>
    </div>
  );
}
