import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Driver-phone GPS ingest. Auth: bus.driverToken (shared secret per bus).
// No session — drivers don't have user accounts. Body is small JSON.
//
// Request:  POST /api/transport/ping
//   { busId, token, lat, lng, speedKmh?, heading? }
// Response: { ok: true } on success, { ok: false, error } otherwise.
//
// Rate guarantees: at the schema layer, only adds a row. Practical rate
// limiting should live behind a CDN/WAF; for the MVP we cap to one ping
// per bus per 2s by checking the most recent capturedAt.

export const runtime = "nodejs";

const MIN_INTERVAL_MS = 1500;

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "bad-json" }, { status: 400 }); }

  const busId = String(body?.busId ?? "");
  const token = String(body?.token ?? "");
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  const speedKmh = Number.isFinite(Number(body?.speedKmh)) ? Number(body.speedKmh) : 0;
  const heading = Number.isFinite(Number(body?.heading)) ? Number(body.heading) : 0;

  if (!busId || !token) return NextResponse.json({ ok: false, error: "missing-auth" }, { status: 400 });
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ ok: false, error: "bad-coords" }, { status: 400 });
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return NextResponse.json({ ok: false, error: "bad-coords" }, { status: 400 });

  const bus = await prisma.bus.findUnique({ where: { id: busId }, select: { id: true, driverToken: true, active: true } });
  if (!bus || !bus.active || !bus.driverToken || bus.driverToken !== token) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  // Drop near-duplicate pings under the rate cap.
  const last = await prisma.gPSPing.findFirst({
    where: { busId },
    orderBy: { capturedAt: "desc" },
    select: { capturedAt: true },
  });
  if (last && Date.now() - last.capturedAt.getTime() < MIN_INTERVAL_MS) {
    return NextResponse.json({ ok: true, throttled: true });
  }

  await prisma.gPSPing.create({
    data: { busId, lat, lng, speedKmh, heading },
  });
  return NextResponse.json({ ok: true });
}
