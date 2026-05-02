"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { CheckCircle2, AlertTriangle, Upload, Sparkles } from "lucide-react";

type TargetField = { key: string; label: string; required: boolean; example: string };

type AnalyzeResp = {
  ok: true;
  targetFields: TargetField[];
  sourceHeaders: string[];
  rowCount: number;
  sampleRows: Record<string, string>[];
  mapping: Record<string, string | null>;
  note: string | null;
};

type RunResp = { ok: true; created: number; skipped: number; errors: { row: number; reason: string }[] };

export default function ImportClient({
  entity, label, targetFields,
}: { entity: string; label: string; targetFields: TargetField[] }) {
  const router = useRouter();
  const [csv, setCsv] = useState<string>("");
  const [analysis, setAnalysis] = useState<AnalyzeResp | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [running, setRunning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<RunResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setError("File is larger than 10 MB."); return; }
    const text = await f.text();
    setCsv(text);
    setAnalysis(null);
    setResult(null);
    setError(null);
  }

  async function analyze() {
    if (!csv.trim()) { setError("Pick a file first."); return; }
    setAnalyzing(true); setError(null);
    const r = await fetch(`/api/import/${entity}/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    const data = await r.json().catch(() => ({}));
    setAnalyzing(false);
    if (!data?.ok) {
      setError(data?.message ?? data?.error ?? "Couldn't analyze the file.");
      return;
    }
    setAnalysis(data);
    setMapping(data.mapping);
  }

  async function run() {
    if (!analysis) return;
    setRunning(true); setError(null);
    const r = await fetch(`/api/import/${entity}/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ csv, mapping }),
    });
    const data = await r.json().catch(() => ({}));
    setRunning(false);
    if (!data?.ok) {
      setError(data?.error === "missing-required-mappings"
        ? `Map required fields first: ${data.fields?.join(", ")}`
        : data?.error ?? "Import failed");
      return;
    }
    setResult(data);
    router.refresh();
  }

  const requiredUnmapped = analysis
    ? targetFields.filter((f) => f.required && !mapping[f.key]).map((f) => f.key)
    : [];

  return (
    <div className="space-y-5">
      {/* Step 1 — pick file */}
      <div className="rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium">1</span>
          <h2 className="font-medium">Upload your CSV</h2>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          Export <strong>{label}</strong> from your existing system (CSV or save-as-CSV from Excel)
          and pick the file. Max 10 MB / 5,000 rows.
        </p>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-sm">
            <Upload className="w-4 h-4" />
            <span>Choose file</span>
            <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
          </label>
          {csv && (
            <span className="text-xs text-slate-500">
              {csv.length.toLocaleString()} chars · {csv.split("\n").length - 1} lines
            </span>
          )}
          <a href={`/api/import/${entity}/template`} className="ml-auto text-xs text-brand-700 hover:underline">
            Download our template
          </a>
        </div>
      </div>

      {/* Step 2 — analyze */}
      <div className="rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium">2</span>
          <h2 className="font-medium">Map columns</h2>
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs text-slate-500">AI will propose a mapping</span>
        </div>
        {!analysis && (
          <Button onClick={analyze} loading={analyzing} disabled={!csv.trim()}>
            {analyzing ? "Reading your file…" : "Analyze + propose mapping"}
          </Button>
        )}
        {analysis && (
          <>
            {analysis.note && (
              <div className="mb-3 text-xs text-slate-500 italic">{analysis.note}</div>
            )}
            <div className="text-xs text-slate-500 mb-3">
              {analysis.rowCount} rows. Adjust any mapping below before running the import.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-slate-500">
                  <tr><th className="text-left py-2 pr-4">Our field</th><th className="text-left py-2 pr-4">Your column</th><th className="text-left py-2">Sample</th></tr>
                </thead>
                <tbody>
                  {targetFields.map((f) => {
                    const sel = mapping[f.key] ?? "";
                    const sample = sel ? analysis.sampleRows.map((r) => r[sel]).filter(Boolean)[0] ?? "" : "";
                    return (
                      <tr key={f.key} className="border-t border-slate-100">
                        <td className="py-2 pr-4">
                          <div className="font-medium">{f.label} {f.required && <span className="text-rose-600">*</span>}</div>
                          <div className="text-xs text-slate-500">{f.example}</div>
                        </td>
                        <td className="py-2 pr-4">
                          <select
                            value={sel}
                            onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value || null }))}
                            className="text-sm rounded-md border border-slate-300 bg-white px-2 py-1.5"
                          >
                            <option value="">— skip —</option>
                            {analysis.sourceHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 text-xs text-slate-500 truncate max-w-xs">{sample}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Step 3 — run */}
      <div className="rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium">3</span>
          <h2 className="font-medium">Run import</h2>
        </div>
        {requiredUnmapped.length > 0 && (
          <div className="text-xs rounded-lg bg-amber-50 text-amber-900 p-2 mb-3">
            Map required fields first: {requiredUnmapped.join(", ")}
          </div>
        )}
        <Button onClick={run} loading={running} disabled={!analysis || requiredUnmapped.length > 0}>
          {running ? "Importing…" : "Run import"}
        </Button>
        {error && (
          <div className="mt-3 rounded-lg bg-rose-50 text-rose-900 px-3 py-2 text-sm flex gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}
        {result && (
          <div className="mt-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Imported {result.created} · skipped {result.skipped} · errors {result.errors.length}
            </div>
            {result.errors.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-emerald-900/80 cursor-pointer">Show {result.errors.length} row error{result.errors.length !== 1 ? "s" : ""}</summary>
                <ul className="mt-1 max-h-48 overflow-y-auto text-xs space-y-0.5 pl-4 list-disc">
                  {result.errors.slice(0, 200).map((e, i) => (
                    <li key={i}>row {e.row}: {e.reason}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
