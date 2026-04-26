import Link from "next/link";
import { complianceCalendar } from "@/lib/compliance";
import { fmtDate } from "@/lib/utils";
import { AlertTriangle, Clock, ChevronRight } from "lucide-react";

export default async function ComplianceTile({ schoolId }: { schoolId: string }) {
  const items = await complianceCalendar(schoolId, 30);
  const overdue = items.filter((i) => i.daysToDue < 0 && i.status !== "FILED");
  const dueSoon = items.filter((i) => i.daysToDue >= 0 && i.daysToDue <= 14 && i.status !== "FILED");
  const top = [...overdue, ...dueSoon].slice(0, 4);

  if (top.length === 0) {
    return (
      <Link href="/tax/calendar" className="card card-pad block hover:shadow-cardHover transition">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">Compliance</div>
            <div className="text-base font-medium mt-1 text-emerald-700">All clear ✓</div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </Link>
    );
  }

  return (
    <Link href="/tax/calendar" className="card hover:shadow-cardHover transition block">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {overdue.length > 0
            ? <AlertTriangle className="w-4 h-4 text-rose-700" />
            : <Clock className="w-4 h-4 text-amber-700" />}
          <h3 className="text-sm font-medium">Compliance — next deadlines</h3>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>
      <ul className="divide-y divide-slate-100">
        {top.map((i) => (
          <li key={`${i.type}-${i.period}`} className="px-4 py-3 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{i.label}</div>
              <div className="text-xs text-slate-500">{i.period} · due {fmtDate(i.dueDate)}</div>
            </div>
            <span className={i.daysToDue < 0 ? "badge-red" : i.daysToDue <= 7 ? "badge-amber" : "badge-blue"}>
              {i.daysToDue < 0 ? `${Math.abs(i.daysToDue)}d late` : `in ${i.daysToDue}d`}
            </span>
          </li>
        ))}
      </ul>
    </Link>
  );
}
