"use client";
import { useState } from "react";
import AIPageShell from "@/components/AIPageShell";

const SAMPLE = `Stationery World
GSTIN: 27AABCS1234A1Z5
Date: 2026-04-18
=================
Notebooks (10) ............... ₹1,200.00
Markers (3 sets) ............... ₹540.00
Highlighters (2) ............... ₹120.00
=================
Subtotal ............... ₹1,860.00
GST (18%) .............. ₹334.80
Total .................. ₹2,194.80
Thank you, please visit again.
`;

export default function ExpenseOcrPage() {
  const [text, setText] = useState(SAMPLE);
  const [parsed, setParsed] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/expense-ocr", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      setParsed(await res.json());
    } finally { setLoading(false); }
  }

  return (
    <AIPageShell
      title="Expense OCR"
      subtitle="Paste a receipt's plain text → extract vendor, date, line items, GST, total. Existing expense flow is unchanged."
      needsLLM
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card card-pad">
          <div className="text-xs font-medium text-slate-500 mb-2">Receipt text</div>
          <textarea value={text} onChange={(e) => setText(e.target.value)}
            className="w-full h-72 text-sm font-mono border rounded-md p-2" />
          <button onClick={go} disabled={loading} className="btn-primary mt-2">
            {loading ? "Extracting..." : "Extract"}
          </button>
        </div>
        <div className="card card-pad">
          <div className="text-xs font-medium text-slate-500 mb-2">Structured output</div>
          <pre className="text-xs bg-slate-50 border border-slate-200 rounded-md p-3 overflow-auto h-72">
            {parsed ? JSON.stringify(parsed, null, 2) : "Paste receipt text and click Extract."}
          </pre>
        </div>
      </div>
    </AIPageShell>
  );
}
