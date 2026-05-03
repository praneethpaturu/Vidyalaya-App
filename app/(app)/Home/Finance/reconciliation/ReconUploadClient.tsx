"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReconUploadClient() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError("File larger than 5 MB."); return; }
    const text = await f.text();
    setCsv(text);
    setFileName(f.name);
    setError(null);
  }

  async function upload() {
    if (!csv.trim()) { setError("Pick a CSV first."); return; }
    setBusy(true); setError(null);
    const r = await fetch("/api/finance/reconciliation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ csv, fileName }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!data?.ok) {
      setError(data?.error ?? "Upload failed.");
      return;
    }
    router.push(`/Home/Finance/reconciliation/${data.importId}`);
  }

  return (
    <div className="card card-pad">
      <div className="text-sm text-slate-700 mb-2">
        Expected CSV columns (any order, headers required):{" "}
        <span className="font-mono text-xs">date, description, reference, debit, credit, balance</span>
      </div>
      <div className="flex items-center gap-3">
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-sm">
          <span>Choose file</span>
          <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
        </label>
        {fileName && <span className="text-xs text-slate-500">{fileName} · {csv.split("\n").length - 1} lines</span>}
        <button onClick={upload} disabled={busy || !csv.trim()} className="btn-primary ml-auto">
          {busy ? "Uploading…" : "Upload + match"}
        </button>
      </div>
      {error && <div className="text-sm text-rose-700 mt-2">{error}</div>}
    </div>
  );
}
