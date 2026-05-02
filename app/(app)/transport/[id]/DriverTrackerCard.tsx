"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, KeyRound, Copy, Trash2, Check } from "lucide-react";

export default function DriverTrackerCard({
  busId, busNumber, tokenIssued, existingToken,
}: {
  busId: string; busNumber: string; tokenIssued: boolean; existingToken: string | null;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(existingToken ?? null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<"link" | "token" | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const trackerUrl = token ? `${origin}/driver/track/${busId}?token=${encodeURIComponent(token)}` : null;

  async function generate() {
    setBusy(true);
    const r = await fetch(`/api/transport/buses/${busId}/driver-token`, { method: "POST" });
    const d = await r.json();
    setBusy(false);
    if (d?.ok) setToken(d.token);
    router.refresh();
  }
  async function revoke() {
    if (!confirm("Revoke the GPS tracker token? The driver's link will stop working.")) return;
    setBusy(true);
    await fetch(`/api/transport/buses/${busId}/driver-token`, { method: "DELETE" });
    setBusy(false);
    setToken(null);
    router.refresh();
  }
  async function copy(value: string, kind: "link" | "token") {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="card mt-4">
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <Smartphone className="w-5 h-5 text-slate-500" />
        <div>
          <h2 className="h-section">Driver phone tracker</h2>
          <p className="text-xs text-slate-500 mt-0.5">Send this link to the driver. They open it on their phone, tap Start, and live GPS replaces the synthetic position on the live map.</p>
        </div>
      </div>

      {!tokenIssued && !token && (
        <div className="p-4 flex items-center justify-between">
          <p className="text-sm text-slate-600">Tracker is off for {busNumber}.</p>
          <button onClick={generate} disabled={busy} className="btn-primary">
            <KeyRound className="w-4 h-4" /> {busy ? "Issuing…" : "Issue tracker link"}
          </button>
        </div>
      )}

      {(tokenIssued || token) && (
        <div className="p-4 space-y-3">
          {trackerUrl ? (
            <>
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Driver link</div>
                <div className="flex gap-2">
                  <input readOnly value={trackerUrl}
                    className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono" />
                  <button onClick={() => copy(trackerUrl, "link")} className="btn-outline">
                    {copied === "link" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-600">A token is already issued for this bus. Generate a new one to replace it (the driver's old link stops working immediately).</p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button onClick={revoke} disabled={busy} className="btn-outline text-rose-700 border-rose-200 hover:bg-rose-50">
              <Trash2 className="w-4 h-4" /> Revoke
            </button>
            <button onClick={generate} disabled={busy} className="btn-primary">
              <KeyRound className="w-4 h-4" /> {busy ? "Rotating…" : "Rotate token"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
