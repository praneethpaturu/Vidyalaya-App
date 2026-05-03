"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  kind: string;
  summary: string;
  status: string;
  createdAt: string;
  decidedAt: string | null;
  comment: string | null;
  payload: string;
};

const KINDS = [
  { v: "", label: "All kinds" },
  { v: "FEE_WAIVER", label: "Fee waiver" },
  { v: "CONCESSION", label: "Concession" },
  { v: "REFUND", label: "Refund" },
  { v: "EXPENSE", label: "Expense" },
  { v: "ADMISSION", label: "Admission" },
  { v: "DOC_EDIT", label: "Document edit" },
  { v: "TC", label: "Transfer Certificate" },
  { v: "LEAVE_ON_BEHALF", label: "Leave (on behalf)" },
  { v: "PROMOTION_REVERT", label: "Promotion revert" },
];

export default function ApprovalsClient({
  rows, status, kind, tally,
}: { rows: Row[]; status: string; kind: string; tally: Record<string, number> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setParam(k: string, v: string) {
    const sp = new URLSearchParams(window.location.search);
    if (v) sp.set(k, v); else sp.delete(k);
    router.replace(`${window.location.pathname}?${sp.toString()}`);
  }

  async function decide(id: string, decision: "APPROVED" | "REJECTED") {
    const comment = decision === "REJECTED"
      ? prompt("Reason for rejection (optional)") ?? undefined
      : undefined;
    setWorking(id);
    setError(null);
    const r = await fetch(`/api/approvals/${id}/decide`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision, comment }),
    });
    const data = await r.json().catch(() => ({}));
    setWorking(null);
    if (!data?.ok) {
      setError(data?.error ?? "Could not save the decision.");
      return;
    }
    start(() => router.refresh());
  }

  return (
    <>
      {/* status pills */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map((s) => (
          <button
            key={s}
            onClick={() => setParam("status", s === "PENDING" ? "" : s)}
            className={`px-3 py-1 rounded-full text-xs ${
              status === s
                ? "bg-brand-700 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {s} {tally[s] != null ? `(${tally[s]})` : ""}
          </button>
        ))}
        <select
          value={kind}
          onChange={(e) => setParam("kind", e.target.value)}
          className="ml-auto text-sm rounded-md border border-slate-300 bg-white px-2 py-1.5"
        >
          {KINDS.map((k) => <option key={k.v} value={k.v}>{k.label}</option>)}
        </select>
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-rose-50 text-rose-900 px-3 py-2 text-sm">{error}</div>
      )}

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Kind</th>
              <th>Summary</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Decision</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-8">Nothing to show.</td></tr>
            )}
            {rows.map((a) => (
              <tr key={a.id}>
                <td><span className="badge-amber whitespace-nowrap">{a.kind}</span></td>
                <td>{a.summary}</td>
                <td>
                  <span className={
                    a.status === "APPROVED" ? "badge-green" :
                    a.status === "REJECTED" ? "badge-red" : "badge-amber"
                  }>{a.status}</span>
                </td>
                <td className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(a.createdAt).toLocaleString("en-IN")}
                </td>
                <td className="text-xs text-slate-500">
                  {a.decidedAt ? new Date(a.decidedAt).toLocaleString("en-IN") : ""}
                  {a.comment && <div className="italic">{a.comment}</div>}
                </td>
                <td className="text-right space-x-2 whitespace-nowrap">
                  {a.status === "PENDING" && (
                    <>
                      <button
                        disabled={working === a.id || pending}
                        onClick={() => decide(a.id, "APPROVED")}
                        className="btn-tonal text-xs px-3 py-1"
                      >Approve</button>
                      <button
                        disabled={working === a.id || pending}
                        onClick={() => decide(a.id, "REJECTED")}
                        className="btn-outline text-xs px-3 py-1"
                      >Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
