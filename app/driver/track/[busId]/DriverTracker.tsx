"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, AlertTriangle, MapPin, Wifi, WifiOff } from "lucide-react";

type Status = "idle" | "running" | "denied" | "unavailable" | "error";

export default function DriverTracker({ busId, token }: { busId: string; token: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [lastPing, setLastPing] = useState<{ lat: number; lng: number; at: Date; speedKmh: number } | null>(null);
  const [pingCount, setPingCount] = useState(0);
  const [errors, setErrors] = useState(0);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const watchIdRef = useRef<number | null>(null);
  const inflightRef = useRef(false);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  function start() {
    if (!("geolocation" in navigator)) { setStatus("unavailable"); return; }
    setStatus("running");
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        const speedKmh = (typeof speed === "number" && speed >= 0) ? speed * 3.6 : 0;
        if (inflightRef.current || !navigator.onLine) return;
        inflightRef.current = true;
        try {
          const r = await fetch("/api/transport/ping", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              busId,
              token,
              lat: latitude,
              lng: longitude,
              speedKmh,
              heading: heading ?? 0,
            }),
            keepalive: true,
          });
          if (r.ok) {
            const d = await r.json().catch(() => ({}));
            if (d?.ok && !d?.throttled) {
              setPingCount((n) => n + 1);
              setLastPing({ lat: latitude, lng: longitude, at: new Date(), speedKmh });
            }
          } else {
            setErrors((n) => n + 1);
          }
        } catch {
          setErrors((n) => n + 1);
        } finally {
          inflightRef.current = false;
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setStatus("denied");
        else setStatus("error");
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
    watchIdRef.current = id;
  }

  function stop() {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus("idle");
  }

  useEffect(() => () => { if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current); }, []);

  return (
    <div className="flex-1 flex flex-col p-5 gap-4">
      <div className="rounded-2xl bg-white border border-slate-200 p-5 text-center">
        <div className="text-xs uppercase tracking-wider text-slate-500">Status</div>
        <div className="text-xl font-semibold text-slate-900 mt-1">
          {status === "idle" && "Ready to start"}
          {status === "running" && "Tracking live"}
          {status === "denied" && "Location permission denied"}
          {status === "unavailable" && "Geolocation not supported"}
          {status === "error" && "Couldn't get a location fix"}
        </div>
        <div className="mt-1 text-xs flex items-center justify-center gap-1.5 text-slate-500">
          {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5 text-rose-500" />}
          {online ? "Online" : "Offline — will resume when network returns"}
        </div>
      </div>

      {status !== "running" ? (
        <button onClick={start}
          className="flex items-center justify-center gap-2 rounded-2xl bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white py-4 text-base font-medium transition">
          <Play className="w-5 h-5" /> Start sharing location
        </button>
      ) : (
        <button onClick={stop}
          className="flex items-center justify-center gap-2 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white py-4 text-base font-medium transition">
          <Pause className="w-5 h-5" /> Stop sharing
        </button>
      )}

      {status === "denied" && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 flex gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">Permission needed</div>
            <div className="text-xs mt-0.5">Enable Location for this site in your browser settings, then tap Start again.</div>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white border border-slate-200 p-5 text-sm space-y-2">
        <div className="flex justify-between"><span className="text-slate-500">Pings sent</span><span className="font-medium">{pingCount}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Errors</span><span className="font-medium">{errors}</span></div>
        {lastPing && (
          <>
            <div className="flex justify-between"><span className="text-slate-500">Last fix</span><span className="font-medium">{lastPing.at.toLocaleTimeString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Speed</span><span className="font-medium">{lastPing.speedKmh.toFixed(1)} km/h</span></div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-2">
              <MapPin className="w-3.5 h-3.5" />
              {lastPing.lat.toFixed(5)}, {lastPing.lng.toFixed(5)}
            </div>
          </>
        )}
      </div>

      <p className="mt-auto text-[11px] text-slate-400 text-center pt-4">
        Keep this page open while driving. The screen can stay locked; pings continue if your phone allows background GPS.
      </p>
    </div>
  );
}
