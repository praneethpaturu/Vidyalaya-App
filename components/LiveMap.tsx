"use client";
import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";

// Dynamically load react-leaflet (its modules touch `window` at import time).
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer    = dynamic(() => import("react-leaflet").then(m => m.TileLayer),    { ssr: false });
const Marker       = dynamic(() => import("react-leaflet").then(m => m.Marker),       { ssr: false });
const Popup        = dynamic(() => import("react-leaflet").then(m => m.Popup),        { ssr: false });
const Polyline     = dynamic(() => import("react-leaflet").then(m => m.Polyline),     { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then(m => m.CircleMarker), { ssr: false });

type Pos = {
  id: string; number: string; route?: string;
  lat: number; lng: number; heading: number; speedKmh: number;
  driver: string; nextStop: string; eta: string;
  stops: { id: string; name: string; lat: number; lng: number; sequence: number }[];
};

const COLORS = ["#1a73e8","#e8710a","#137333","#a142f4","#d93025","#1e8e3e","#f9ab00","#ad1457"];

export default function LiveMap({ focusBusId }: { focusBusId?: string }) {
  const [positions, setPositions] = useState<Pos[]>([]);
  const [selected, setSelected] = useState<string | null>(focusBusId ?? null);
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [Lmod, setLmod] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    import("leaflet").then((mod) => setLmod(mod.default ?? mod));
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      const r = await fetch("/api/transport/positions", { cache: "no-store" });
      const j = await r.json();
      if (alive) setPositions(j.positions);
    }
    load();
    const i = setInterval(() => { load(); setTick((t) => t + 1); }, 2000);
    return () => { alive = false; clearInterval(i); };
  }, []);

  const center = useMemo<[number, number]>(() => {
    if (positions.length === 0) return [12.97, 77.66];
    return [
      positions.reduce((s, p) => s + p.lat, 0) / positions.length,
      positions.reduce((s, p) => s + p.lng, 0) / positions.length,
    ];
  }, [positions.length]);

  const sel = positions.find((p) => p.id === selected) ?? null;

  function busIcon(color: string, label: string) {
    if (!Lmod) return undefined as any;
    return Lmod.divIcon({
      className: "",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      html: `
        <div style="width:28px;height:28px;border-radius:8px;background:${color};
          color:#fff;display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 10px rgba(0,0,0,.25);font:600 11px system-ui;
          border:2px solid #fff;">🚌</div>
        <div style="position:absolute;top:30px;left:50%;transform:translateX(-50%);
          background:#fff;border-radius:6px;padding:1px 6px;font:600 10px system-ui;
          box-shadow:0 2px 6px rgba(0,0,0,.15);white-space:nowrap;">${label}</div>
      `,
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-4 h-[calc(100vh-9rem)]">
      <div className="card overflow-hidden">
        {mounted && Lmod && (
          <MapContainer center={center} zoom={12} className="w-full h-full">
            <TileLayer
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {positions.map((p, idx) => {
              const color = COLORS[idx % COLORS.length];
              return (
                <div key={p.id}>
                  <Polyline
                    positions={p.stops.map((s) => [s.lat, s.lng]) as any}
                    pathOptions={{ color, weight: 3, opacity: 0.55, dashArray: "6 6" }}
                  />
                  {p.stops.map((s) => (
                    <CircleMarker
                      key={s.id}
                      center={[s.lat, s.lng]}
                      radius={5}
                      pathOptions={{ color, fillColor: "#fff", fillOpacity: 1, weight: 2 }}
                    >
                      <Popup>
                        <strong>{s.name}</strong><br/>Stop #{s.sequence}
                      </Popup>
                    </CircleMarker>
                  ))}
                  <Marker
                    position={[p.lat, p.lng]}
                    icon={busIcon(color, p.number)}
                    eventHandlers={{ click: () => setSelected(p.id) }}
                  >
                    <Popup>
                      <div>
                        <div className="font-semibold">{p.number}</div>
                        <div>{p.route}</div>
                        <div>Driver: {p.driver}</div>
                        <div>Speed: {p.speedKmh} km/h</div>
                        <div>Next: {p.nextStop} ({p.eta})</div>
                      </div>
                    </Popup>
                  </Marker>
                </div>
              );
            })}
          </MapContainer>
        )}
        {!mounted && <div className="h-full grid place-items-center text-slate-400">Loading map…</div>}
      </div>

      <aside className="card overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="h-section">Live buses</h2>
          <span className="badge-green">● Mock GPS · {tick}</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {positions.map((p, idx) => {
            const color = COLORS[idx % COLORS.length];
            const isSel = p.id === selected;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition ${isSel ? "bg-brand-50/60" : ""}`}
              >
                <div className="w-8 h-8 rounded-lg shrink-0" style={{ background: color }} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium font-mono">{p.number}</div>
                  <div className="text-xs text-slate-500 truncate">{p.route}</div>
                  <div className="text-xs text-slate-500 mt-0.5">→ {p.nextStop} · {p.eta}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium">{p.speedKmh} km/h</div>
                </div>
              </button>
            );
          })}
        </div>
        {sel && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 text-sm">
            <div className="font-medium font-mono">{sel.number}</div>
            <div className="text-xs text-slate-500">{sel.route}</div>
            <div className="mt-2 text-xs">Driver: <span className="font-medium">{sel.driver}</span></div>
            <div className="text-xs">Next stop: <span className="font-medium">{sel.nextStop}</span> · ETA {sel.eta}</div>
          </div>
        )}
      </aside>
    </div>
  );
}
