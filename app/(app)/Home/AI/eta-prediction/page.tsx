import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AIPageShell from "@/components/AIPageShell";
import { predictEta } from "@/lib/ai";

function distKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default async function EtaPredictionPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId as string;

  const buses = await prisma.bus.findMany({
    where: { schoolId: sId, active: true },
    include: {
      route: { include: { stops: { orderBy: { sequence: "asc" } } } },
      pings: { orderBy: { capturedAt: "desc" }, take: 6 },
    },
  });

  const rows = buses.map((b) => {
    const ping = b.pings[0];
    const stops = b.route?.stops ?? [];
    if (!ping || stops.length === 0) {
      return { bus: b, etas: [] as { name: string; minutes: number; band: string }[] };
    }
    const recentSpeed =
      b.pings.reduce((a, p) => a + (p.speedKmh || 0), 0) / Math.max(1, b.pings.length);
    // Assume last visited stop is the closest to current ping; ETA for the next 3 stops.
    let closestIdx = 0;
    let closestDist = Number.POSITIVE_INFINITY;
    stops.forEach((s, i) => {
      const d = distKm(ping, s);
      if (d < closestDist) { closestDist = d; closestIdx = i; }
    });
    const upcoming = stops.slice(closestIdx + 1, closestIdx + 4);
    let cur = { lat: ping.lat, lng: ping.lng };
    let cumKm = 0;
    const traffic = recentSpeed < 18 ? 1.4 : recentSpeed > 35 ? 0.9 : 1.0;
    const etas = upcoming.map((s) => {
      cumKm += distKm(cur, s);
      cur = { lat: s.lat, lng: s.lng };
      const e = predictEta(cumKm, recentSpeed || 22, traffic);
      return { name: s.name, minutes: e.minutes, band: e.band };
    });
    return { bus: b, etas };
  });

  return (
    <AIPageShell
      title="Bus ETA Prediction"
      subtitle="Live ETA per upcoming stop, derived from recent GPS speed and a simple traffic factor."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {rows.map(({ bus, etas }) => (
          <div key={bus.id} className="card card-pad">
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="font-medium">{bus.number}</div>
                <div className="text-xs text-slate-500">{bus.route?.name ?? "—"}</div>
              </div>
              <div className="text-[11px] text-slate-500">{bus.pings.length} recent pings</div>
            </div>
            {etas.length === 0 ? (
              <div className="text-xs text-slate-500">No GPS data — connect VTS for live ETAs.</div>
            ) : (
              <ul className="text-sm space-y-1">
                {etas.map((e, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{e.name}</span>
                    <span className={`text-xs ${
                      e.band === "DELAYED" ? "text-rose-700" :
                      e.band === "EARLY" ? "text-emerald-700" : "text-slate-700"
                    }`}>
                      ~{e.minutes} min · {e.band.toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </AIPageShell>
  );
}
