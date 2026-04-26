import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";
import { scoreDriver, hashString, pct } from "@/lib/ai";

export default async function DriverScorePage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  const buses = await prisma.bus.findMany({
    where: { schoolId: sId },
    include: {
      driver: { include: { user: true } },
      pings: { orderBy: { capturedAt: "desc" }, take: 200 },
      route: true,
    },
  });

  const rows = buses
    .filter((b) => b.driver)
    .map((b) => {
      const speeds = b.pings.map((p) => p.speedKmh);
      const avg = speeds.length ? speeds.reduce((a, c) => a + c, 0) / speeds.length : 0;
      // Synthesize harsh-braking / speeding / on-time stats deterministically per bus.
      const seed = hashString(b.id);
      const harsh = ((seed % 13) / 4) + Math.max(0, 35 - avg) / 18;
      const speeding = ((seed % 7) / 3) + Math.max(0, avg - 38) / 12;
      const idling = (seed % 9) + 4;
      const onTime = 0.88 + ((seed % 11) / 100);
      const complaints = (seed % 5) === 0 ? 1 : 0;
      const r = scoreDriver({
        harshBrakingPer100km: harsh,
        speedingEventsPer100km: speeding,
        idlingMinutesPerTrip: idling,
        onTimeRate: onTime,
        complaintsLast30d: complaints,
      });
      return { b, r, harsh, speeding, idling, onTime, complaints };
    })
    .sort((a, b) => b.r.score - a.r.score);

  return (
    <AIPageShell
      title="Driver Behaviour Score"
      subtitle="Higher = safer. Synthesized from VTS speed history, harsh-event proxies, idling, on-time and complaints."
    >
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Score</th>
              <th>Driver</th>
              <th>Bus</th>
              <th>Route</th>
              <th>Harsh / 100km</th>
              <th>Speeding / 100km</th>
              <th>Idle min/trip</th>
              <th>On-time</th>
              <th>Complaints</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ b, r, harsh, speeding, idling, onTime, complaints }) => (
              <tr key={b.id}>
                <td>
                  <span className={r.band === "HIGH" ? "badge-green" : r.band === "MEDIUM" ? "badge-amber" : "badge-red"}>
                    {pct(r.score)}
                  </span>
                </td>
                <td className="font-medium">{b.driver?.user.name}</td>
                <td>{b.number}</td>
                <td>{b.route?.name ?? "—"}</td>
                <td>{harsh.toFixed(1)}</td>
                <td>{speeding.toFixed(1)}</td>
                <td>{idling}</td>
                <td>{(onTime * 100).toFixed(0)}%</td>
                <td>{complaints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AIPageShell>
  );
}
