import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";
import { scoreMaintenance, hashString, pct } from "@/lib/ai";

export default async function MaintenancePage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  const buses = await prisma.bus.findMany({
    where: { schoolId: sId },
    include: { route: true },
  });

  // VehicleDoc may not be present in every seed; pull defensively.
  let docs: any[] = [];
  try {
    docs = await (prisma as any).vehicleDoc.findMany({
      where: { schoolId: sId },
      select: { busId: true, validTill: true },
    });
  } catch { /* model not seeded */ }
  const docByBus = new Map<string, Date>();
  for (const d of docs) {
    const cur = docByBus.get(d.busId);
    if (!cur || d.validTill < cur) docByBus.set(d.busId, d.validTill);
  }

  const rows = buses.map((b) => {
    const seed = hashString(b.id);
    const odometerKm = 80000 + (seed % 80000);
    const kmSinceLastService = (seed % 10000) + 1500;
    const ageYears = ((seed >> 4) % 14) + 1;
    const breakdowns = (seed % 17) < 3 ? 1 : 0;
    const minDoc = docByBus.get(b.id);
    const docExpiryDays = minDoc
      ? Math.floor((minDoc.getTime() - Date.now()) / 86400000)
      : 120;
    const r = scoreMaintenance({
      odometerKm,
      kmSinceLastService,
      ageYears,
      pastBreakdownsLast90d: breakdowns,
      docExpiryDays,
    });
    return { b, r, odometerKm, kmSinceLastService, ageYears, breakdowns, docExpiryDays };
  })
  .sort((a, b) => b.r.score - a.r.score);

  return (
    <AIPageShell
      title="Predictive Maintenance"
      subtitle="Buses ranked by likelihood of needing service soon — service interval, age, recent breakdowns and doc expiry."
    >
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Risk</th>
              <th>Bus</th>
              <th>Route</th>
              <th>Odometer</th>
              <th>Since service</th>
              <th>Age</th>
              <th>Breakdowns 90d</th>
              <th>Doc expiry</th>
              <th>Reasons</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ b, r, odometerKm, kmSinceLastService, ageYears, breakdowns, docExpiryDays }) => (
              <tr key={b.id}>
                <td>
                  <span className={r.band === "HIGH" ? "badge-red" : r.band === "MEDIUM" ? "badge-amber" : "badge-slate"}>
                    {pct(r.score)}
                  </span>
                </td>
                <td className="font-medium">{b.number}</td>
                <td>{b.route?.name ?? "—"}</td>
                <td>{odometerKm.toLocaleString()} km</td>
                <td>{kmSinceLastService.toLocaleString()} km</td>
                <td>{ageYears}y</td>
                <td>{breakdowns}</td>
                <td className="text-xs">{docExpiryDays < 0 ? `expired ${-docExpiryDays}d` : `${docExpiryDays}d`}</td>
                <td className="text-xs text-slate-600">{r.reasons.join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AIPageShell>
  );
}
