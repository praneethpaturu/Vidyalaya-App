import Link from "next/link";
import { Map as MapIcon } from "lucide-react";

export default function VTSPage() {
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page text-slate-700 mb-3">VTS — Vehicle Tracking System</h1>
      <p className="muted mb-4">GPS-based live tracking, geofencing per stop, over-speed and harsh-braking alerts, trip replay, parent app live-track.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="card card-pad">
          <div className="text-sm font-medium">Live tracking</div>
          <div className="text-xs text-slate-500 mt-1">Open the live map for real-time bus positions and ETAs.</div>
          <Link href="/transport/live" className="btn-primary text-sm mt-3 inline-flex items-center gap-1.5">
            <MapIcon className="w-4 h-4" /> Open Live Map
          </Link>
        </div>
        <div className="card card-pad">
          <div className="text-sm font-medium">Alerts (last 24h)</div>
          <ul className="mt-2 text-xs space-y-1">
            <li className="flex justify-between"><span>Over-speeding</span><span className="badge-amber">0</span></li>
            <li className="flex justify-between"><span>Harsh braking</span><span className="badge-amber">0</span></li>
            <li className="flex justify-between"><span>Geofence violations</span><span className="badge-slate">0</span></li>
            <li className="flex justify-between"><span>Ignition off mid-route</span><span className="badge-slate">0</span></li>
          </ul>
        </div>
        <div className="card card-pad">
          <div className="text-sm font-medium">Devices</div>
          <ul className="mt-2 text-xs space-y-1">
            <li className="flex justify-between"><span>Online</span><span className="badge-green">6 / 6</span></li>
            <li className="flex justify-between"><span>Offline &gt; 30 min</span><span className="badge-slate">0</span></li>
            <li className="flex justify-between"><span>Last sync</span><span className="text-slate-500">just now</span></li>
          </ul>
        </div>
      </div>
      <div className="card card-pad text-xs text-slate-500">
        Trip replay, route deviation, idle time, over-speed thresholds and geofence per stop are configurable in <Link href="/Settings" className="text-brand-700 hover:underline">Settings → Integrations → VTS</Link>.
      </div>
    </div>
  );
}
