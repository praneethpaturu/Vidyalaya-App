import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// Mock GPS endpoint:
// Returns interpolated positions for each bus along its route stops, animated by minute-of-day.
// Real integration would replace this with a query on GPSPing table being fed by trackers.

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const sId = (session.user as any).schoolId;

  const buses = await prisma.bus.findMany({
    where: { schoolId: sId },
    include: { route: { include: { stops: { orderBy: { sequence: "asc" } } } }, driver: { include: { user: true } } },
  });

  // Pseudo-clock: cycle through the day every 4 minutes of wall time so the demo
  // shows movement without waiting for real morning/afternoon trips.
  const cycleMs = 4 * 60 * 1000;
  const t = (Date.now() % cycleMs) / cycleMs; // 0..1

  const positions = buses.map((b) => {
    const stops = b.route?.stops ?? [];
    if (stops.length < 2) return null;
    // map t in [0,1] to segment index and segment progress
    const totalSeg = stops.length - 1;
    const exact = t * totalSeg;
    const seg = Math.min(totalSeg - 1, Math.floor(exact));
    const local = exact - seg;
    const a = stops[seg]; const c = stops[seg + 1];
    const lat = a.lat + (c.lat - a.lat) * local;
    const lng = a.lng + (c.lng - a.lng) * local;
    // bearing
    const dy = c.lat - a.lat; const dx = c.lng - a.lng;
    const heading = (Math.atan2(dx, dy) * 180) / Math.PI;
    const speedKmh = 18 + Math.round(Math.random() * 14);

    return {
      id: b.id, number: b.number, route: b.route?.name,
      lat, lng, heading, speedKmh,
      driver: b.driver?.user.name ?? "—",
      nextStop: c.name, eta: `${Math.max(1, Math.round((1 - local) * 6))} min`,
      stops: stops.map((s) => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng, sequence: s.sequence })),
    };
  }).filter(Boolean);

  return NextResponse.json({ positions, ts: Date.now() });
}
