import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import DriverTracker from "./DriverTracker";

// Public page (middleware allowlists /driver). Auth is by ?token=<bus.driverToken>.
// Once loaded, the page asks the driver phone for geolocation permission and
// streams pings to /api/transport/ping every few seconds.

export const dynamic = "force-dynamic";

export default async function DriverTrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ busId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { busId } = await params;
  const { token } = await searchParams;
  if (!token) notFound();

  const bus = await prisma.bus.findUnique({
    where: { id: busId },
    include: { route: { include: { stops: { orderBy: { sequence: "asc" } } } }, school: true },
  });
  if (!bus || !bus.active || !bus.driverToken || bus.driverToken !== token) notFound();

  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-brand-700 text-white px-5 py-4">
        <div className="text-xs uppercase tracking-wider opacity-80">{bus.school.name}</div>
        <div className="text-xl font-semibold">Bus {bus.number}</div>
        <div className="text-sm opacity-90 mt-0.5">
          {bus.route?.name ?? "No route assigned"}
          {bus.route ? ` · ${bus.route.stops.length} stops` : ""}
        </div>
      </header>
      <DriverTracker busId={bus.id} token={token} />
    </main>
  );
}
