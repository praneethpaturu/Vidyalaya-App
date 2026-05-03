"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Invoice = {
  id: string;
  number: string;
  dueDate: string;
  total: number;
  amountPaid: number;
  balance: number;
  status: string;
};

const METHODS = ["CASH", "UPI", "CARD", "NETBANKING", "CHEQUE"];

function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export default function CollectClient({
  studentId, invoices,
}: { studentId: string; invoices: Invoice[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(() => new Set(invoices.map((i) => i.id)));
  const [method, setMethod] = useState("CASH");
  const [txnRef, setTxnRef] = useState("");

  const totalSelected = useMemo(
    () => invoices.filter((i) => selected.has(i.id)).reduce((s, i) => s + i.balance, 0),
    [invoices, selected],
  );
  const [amount, setAmount] = useState(totalSelected);

  // Sync amount when selection changes — but allow user override.
  const [touchedAmount, setTouchedAmount] = useState(false);
  const effectiveAmount = touchedAmount ? amount : totalSelected;

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setTouchedAmount(false);
  }

  async function record() {
    setBusy(true); setError(null);
    const r = await fetch("/api/finance/payments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        studentId,
        invoiceIds: Array.from(selected),
        amountRupees: effectiveAmount / 100,
        method,
        txnRef: txnRef || null,
      }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!data?.ok) {
      setError(data?.error ?? "Could not record payment.");
      return;
    }
    start(() => {
      const sp = new URLSearchParams(window.location.search);
      sp.set("paid", data.receiptNo);
      router.replace(`${window.location.pathname}?${sp.toString()}`);
      router.refresh();
    });
  }

  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th></th><th>Invoice</th><th>Due</th><th className="text-right">Total</th>
            <th className="text-right">Paid</th><th className="text-right">Balance</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 && (
            <tr><td colSpan={7} className="text-center text-slate-500 py-8">No outstanding invoices.</td></tr>
          )}
          {invoices.map((i) => (
            <tr key={i.id}>
              <td><input type="checkbox" checked={selected.has(i.id)} onChange={() => toggle(i.id)} /></td>
              <td className="font-mono text-xs">{i.number}</td>
              <td className="text-xs">{new Date(i.dueDate).toLocaleDateString("en-IN")}</td>
              <td className="text-right">{inr(i.total)}</td>
              <td className="text-right">{inr(i.amountPaid)}</td>
              <td className="text-right font-medium">{inr(i.balance)}</td>
              <td>
                <span className={
                  i.status === "OVERDUE" ? "badge-red" :
                  i.status === "PARTIAL" ? "badge-amber" :
                  "badge-blue"
                }>{i.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {invoices.length > 0 && (
        <div className="border-t border-slate-100 p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="label">Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="input">
              {METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Txn / cheque ref</label>
            <input value={txnRef} onChange={(e) => setTxnRef(e.target.value)} className="input" placeholder="UPI ref / cheque no" />
          </div>
          <div>
            <label className="label">Amount (₹)</label>
            <input
              type="number" min={0} step={0.01}
              value={(touchedAmount ? amount : totalSelected) / 100}
              onChange={(e) => { setTouchedAmount(true); setAmount(Math.round(Number(e.target.value || 0) * 100)); }}
              className="input"
            />
          </div>
          <button
            onClick={record}
            disabled={busy || pending || effectiveAmount <= 0 || selected.size === 0}
            className="btn-primary w-full"
          >
            {busy ? "Recording…" : `Collect ${inr(effectiveAmount)}`}
          </button>
          {error && <div className="text-sm text-rose-700 md:col-span-5">{error}</div>}
        </div>
      )}
    </div>
  );
}
