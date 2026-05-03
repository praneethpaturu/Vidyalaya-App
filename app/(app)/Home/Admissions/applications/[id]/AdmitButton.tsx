"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function AdmitButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [admissionNo, setAdmissionNo] = useState("");
  const [rollNo, setRollNo] = useState("");

  async function admit() {
    setBusy(true);
    setError(null);
    const r = await fetch(`/api/admissions/applications/${applicationId}/admit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ admissionNo, rollNo }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!data?.ok) {
      setError(data?.error ?? "Could not admit. Check class assignment and fee status.");
      return;
    }
    start(() => router.refresh());
  }

  return (
    <div className="space-y-2">
      <input className="input" value={admissionNo} onChange={(e) => setAdmissionNo(e.target.value)} placeholder="Admission no (auto if blank)" />
      <input className="input" value={rollNo} onChange={(e) => setRollNo(e.target.value)} placeholder="Roll no (optional)" />
      {error && <div className="text-xs text-rose-700">{error}</div>}
      <button onClick={admit} disabled={busy || pending} className="btn-primary w-full text-sm">
        {busy ? "Admitting…" : "Admit · create student record"}
      </button>
    </div>
  );
}
