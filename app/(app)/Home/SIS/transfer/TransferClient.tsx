"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Peer = { id: string; name: string; city: string };
type Stu = { id: string; admissionNo: string; name: string; className: string };

export default function TransferClient({
  peers, searchedStudents, currentQuery,
}: { peers: Peer[]; searchedStudents: Stu[]; currentQuery: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState(currentQuery);
  const [studentId, setStudentId] = useState<string>("");
  const [toSchoolId, setToSchoolId] = useState<string>("");
  const [reason, setReason] = useState("");

  function search() {
    const sp = new URLSearchParams(window.location.search);
    if (q) sp.set("q", q); else sp.delete("q");
    router.replace(`${window.location.pathname}?${sp.toString()}`);
  }

  async function transfer() {
    if (!studentId || !toSchoolId) {
      setError("Pick a student + destination branch first."); return;
    }
    setBusy(true); setError(null);
    const r = await fetch("/api/sis/transfer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ studentId, toSchoolId, reason }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!data?.ok) {
      setError(data?.error ?? "Transfer failed.");
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    sp.set("transferred", "1");
    router.replace(`${window.location.pathname}?${sp.toString()}`);
    router.refresh();
  }

  return (
    <div className="card card-pad space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="label">Search student</label>
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="input" placeholder="Admission no or name"
          />
        </div>
        <button onClick={search} className="btn-tonal">Search</button>
      </div>

      {searchedStudents.length > 0 && (
        <div>
          <label className="label">Pick student *</label>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="input">
            <option value="">— Select —</option>
            {searchedStudents.map((s) => (
              <option key={s.id} value={s.id}>{s.admissionNo} · {s.name} · {s.className}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="label">Destination branch *</label>
        <select value={toSchoolId} onChange={(e) => setToSchoolId(e.target.value)} className="input">
          <option value="">— Select —</option>
          {peers.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.city}</option>)}
        </select>
        {peers.length === 0 && (
          <p className="text-xs text-slate-500 mt-1">
            No peer branches found. Set this school's group in <a className="underline" href="/Settings/zones">Settings → Zones</a>.
          </p>
        )}
      </div>

      <div>
        <label className="label">Reason</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)} className="input" placeholder="Family relocation" />
      </div>

      {error && <div className="text-sm text-rose-700">{error}</div>}
      <div className="flex justify-end">
        <button onClick={transfer} disabled={busy || !studentId || !toSchoolId} className="btn-primary">
          {busy ? "Transferring…" : "Initiate transfer"}
        </button>
      </div>
    </div>
  );
}
