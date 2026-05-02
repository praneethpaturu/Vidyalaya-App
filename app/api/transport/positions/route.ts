import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// Returns the latest position for each bus the caller's school operates.
// Source priority:
//   1. Real GPS pings written to `GPSPing` (within FRESH_WINDOW_MS) by the
//      driver-phone tracker at /driver/track/[busId] or by hardware ingest.
//   2. A synthesized position interpolated along route stops on a
//      4-minute pseudo-clock (demo fallback so the live map always animates).
// `source: "live" | "synthetic"` distinguishes them on the client.

const FRESH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const sId = (session.user as any).schoolId;

  const buses = await prisma.bus.findMany({
    where: { schoolId: sId, active: true },
    include: {
      route: { include: { stops: { orderBy: { sequence: "asc" } } } },
      driver: { include: { user: true } },
      pings: { orderBy: { capturedAt: "desc" }, take: 1 },
    },
  });

  // Pseudo-clock for synthetic interpolation.
  const cycleMs = 4 * 60 * 1000;
  const t = (Date.now() % cycleMs) / cycleMs;
  const cutoff = Date.now() - FRESH_WINDOW_MS;

  const positions = buses.map((b) => {
    const stops = b.route?.stops ?? [];
    const fresh = b.pings[0] && b.pings[0].capturedAt.getTime() >= cutoff ? b.pings[0] : null;

    let lat: number, lng: number, heading: number, speedKmh: number, source: "live" | "synthetic";
    let nextStop: string | null = null, eta: string | null = null;

    if (fresh) {
      lat = fresh.lat; lng = fresh.lng; heading = fresh.heading; speedKmh = fresh.speedKmh;
      source = "live";
      // Pick the nearest upcoming stop as a heuristic next-stop / ETA.
      if (stops.length) {
        const dist = stops.map((s) => Math.hypot(s.lat - lat, s.lng - lng));
        const idx = dist.indexOf(Math.min(...dist));
        nextStop = stops[idx]?.name ?? null;
        // ~1 deg ≈ 111 km, so distMin*111 km / max(speed, 5) gives mins.
        const km = dist[idx] * 111;
        const mins = Math.max(1, Math.round((km / Math.max(speedKmh, 5)) * 60));
        eta = `${mins} min`;
      }
    } else {
      if (stops.length < 2) return null;
      const totalSeg = stops.length - 1;
      const exact = t * totalSeg;
      const seg = Math.min(totalSeg - 1, Math.floor(exact));
      const local = exact - seg;
      const a = stops[seg]; const c = stops[seg + 1];
      lat = a.lat + (c.lat - a.lat) * local;
      lng = a.lng + (c.lng - a.lng) * local;
      const dy = c.lat - a.lat; const dx = c.lng - a.lng;
      heading = (Math.atan2(dx, dy) * 180) / Math.PI;
      speedKmh = 18 + Math.round(Math.random() * 14);
      source = "synthetic";
      nextStop = c.name;
      eta = `${Math.max(1, Math.round((1 - local) * 6))} min`;
    }

    return {
      id: b.id, number: b.number, route: b.route?.name,
      lat, lng, heading, speedKmh, source,
      driver: b.driver?.user.name ?? "—",
      nextStop, eta,
      lastFixAt: fresh?.capturedAt ?? null,
      stops: stops.map((s) => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng, sequence: s.sequence })),
    };
  }).filter(Boolean);

  return NextResponse.json({ positions, ts: Date.now() });
}
