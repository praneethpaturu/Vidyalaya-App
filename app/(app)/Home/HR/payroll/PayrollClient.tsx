"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function PayrollClient({
  year, month, months,
}: { year: number; month: number; months: string[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setParam(k: string, v: string) {
    const sp = new URLSearchParams(window.location.search);
    if (v) sp.set(k, v); else sp.delete(k);
    router.replace(`${window.location.pathname}?${sp.toString()}`);
  }

  async function generate() {
    setBusy(true); setError(null);
    const r = await fetch("/api/payroll/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ year, month }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!data?.ok) {
      setError(data?.error ?? "Generation failed.");
      return;
    }
    start(() => {
      const sp = new URLSearchParams(window.location.search);
      sp.set("generated", String(data.count));
      router.replace(`${window.location.pathname}?${sp.toString()}`);
      router.refresh();
    });
  }

  return (
    <div className="card card-pad mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
      <div>
        <label className="label">Year</label>
        <input type="number" min={2020} max={2099} value={year}
          onChange={(e) => setParam("year", e.target.value)} className="input" />
      </div>
      <div>
        <label className="label">Month</label>
        <select value={month} onChange={(e) => setParam("month", e.target.value)} className="input">
          {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
      </div>
      <div className="md:col-span-2 flex justify-end gap-2">
        {error && <div className="text-sm text-rose-700 self-center mr-auto">{error}</div>}
        <button onClick={generate} disabled={busy || pending} className="btn-primary">
          {busy ? "Generating…" : `Generate payslips for ${months[month - 1]} ${year}`}
        </button>
      </div>
    </div>
  );
}
