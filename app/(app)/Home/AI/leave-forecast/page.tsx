import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";
import { forecastLeaves } from "@/lib/ai";

export default async function LeaveForecastPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  // Build daily leave counts for the last 56 days.
  const since = new Date(Date.now() - 56 * 86400000);
  const leaves = await prisma.leaveRequest.findMany({
    where: {
      staff: { schoolId: sId },
      status: "APPROVED",
      fromDate: { gte: since },
    },
    select: { fromDate: true, toDate: true },
  });

  const daily = new Array(56).fill(0);
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  for (const l of leaves) {
    let d = new Date(l.fromDate); d.setHours(0, 0, 0, 0);
    const end = new Date(l.toDate); end.setHours(0, 0, 0, 0);
    while (d <= end) {
      const idx = Math.floor((d.getTime() - since.getTime()) / 86400000);
      if (idx >= 0 && idx < 56) daily[idx]++;
      d = new Date(d.getTime() + 86400000);
    }
  }

  const forecast = forecastLeaves(daily, 7);
  const total = forecast.reduce((a, b) => a + b, 0);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dow = today0.getDay();
  const labels = Array.from({ length: 7 }, (_, i) => days[(dow + i + 6) % 7]);

  const max = Math.max(1, ...forecast, ...daily.slice(-14));

  return (
    <AIPageShell
      title="Leave Forecast"
      subtitle="Projected daily leave count for the next 7 days based on weekday patterns from the last 8 weeks."
    >
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Forecast (next 7d)" value={total} />
        <Stat label="History 14d" value={daily.slice(-14).reduce((a, b) => a + b, 0)} />
        <Stat label="Approved leaves window" value={leaves.length} />
      </div>
      <div className="card card-pad">
        <div className="text-xs font-medium text-slate-500 mb-3">Next 7 days projection</div>
        <div className="grid grid-cols-7 gap-2">
          {forecast.map((v, i) => (
            <div key={i} className="text-center">
              <div className="h-32 flex items-end justify-center">
                <div
                  className={`w-8 rounded-t ${v > 5 ? "bg-rose-500" : v > 2 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ height: `${(v / max) * 100}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{labels[i]}</div>
              <div className="text-sm font-medium">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </AIPageShell>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card card-pad">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-3xl font-medium">{value}</div>
    </div>
  );
}
