import { requirePageRole } from "@/lib/auth";
import { complianceCalendar } from "@/lib/compliance";
import { fmtDate, inr } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, Clock, Bell, Sparkles } from "lucide-react";
import { seedComplianceCalendar, sendComplianceReminders } from "@/app/actions/tax";

export default async function CalendarPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const items = await complianceCalendar(u.schoolId, 90);

  const overdue = items.filter((i) => i.daysToDue < 0 && i.status !== "FILED");
  const dueSoon = items.filter((i) => i.daysToDue >= 0 && i.daysToDue <= 7 && i.status !== "FILED");
  const upcoming = items.filter((i) => i.daysToDue > 7 && i.status !== "FILED");
  const filed = items.filter((i) => i.status === "FILED");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <p className="muted">{items.length} filings in the next 90 days</p>
        <div className="flex gap-2">
          <form action={seedComplianceCalendar}><button className="btn-outline">Seed next 12 months</button></form>
          <form action={async () => { "use server"; await sendComplianceReminders(7); }}>
            <button className="btn-tonal"><Bell className="w-4 h-4" /> Send reminders for due-soon</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Tile label="Overdue" value={overdue.length} tone="red" icon={AlertTriangle} />
        <Tile label="Due in ≤ 7 days" value={dueSoon.length} tone="amber" icon={Clock} />
        <Tile label="Upcoming" value={upcoming.length} tone="blue" icon={Sparkles} />
        <Tile label="Filed" value={filed.length} tone="green" icon={CheckCircle2} />
      </div>

      {overdue.length > 0 && <Section title="Overdue" items={overdue} tone="red" />}
      {dueSoon.length > 0 && <Section title="Due soon (≤ 7 days)" items={dueSoon} tone="amber" />}
      {upcoming.length > 0 && <Section title="Upcoming" items={upcoming} tone="blue" />}
      {filed.length > 0 && <Section title="Recently filed" items={filed} tone="green" />}
    </div>
  );
}

function Tile({ label, value, tone, icon: Icon }: any) {
  const t = tone === "red" ? "text-rose-700" : tone === "amber" ? "text-amber-700" : tone === "blue" ? "text-brand-700" : "text-emerald-700";
  return (
    <div className="card card-pad">
      <div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${t}`} /><div className="text-xs text-slate-500">{label}</div></div>
      <div className={`kpi-num mt-1 ${t}`}>{value}</div>
    </div>
  );
}

function Section({ title, items, tone }: any) {
  const colorClass = tone === "red" ? "border-rose-200 bg-rose-50/30" : tone === "amber" ? "border-amber-200 bg-amber-50/30" : tone === "blue" ? "border-brand-200 bg-brand-50/20" : "border-emerald-200 bg-emerald-50/20";
  return (
    <div className={`card mb-4 ${colorClass}`}>
      <div className="p-4 border-b border-slate-100"><h2 className="h-section">{title}</h2></div>
      <table className="table">
        <thead><tr><th>Type</th><th>Period</th><th>Due date</th><th>Days to due</th><th>Status</th></tr></thead>
        <tbody>
          {items.map((i: any) => (
            <tr key={`${i.type}-${i.period}`}>
              <td className="font-medium">{i.label}</td>
              <td className="text-slate-600">{i.period}</td>
              <td>{fmtDate(i.dueDate)}</td>
              <td className={i.daysToDue < 0 ? "text-rose-700 font-medium" : i.daysToDue <= 7 ? "text-amber-700 font-medium" : "text-slate-600"}>
                {i.daysToDue < 0 ? `${Math.abs(i.daysToDue)} days late` : i.daysToDue === 0 ? "today" : `in ${i.daysToDue} days`}
              </td>
              <td>{i.status === "FILED" ? <span className="badge-green">Filed</span> : <span className="badge-amber">Pending</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
