"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { inr } from "@/lib/utils";
import { toast } from "sonner";

export default function PayNowButton({ invoiceId, amount }: { invoiceId: string; amount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"select" | "processing" | "success">("select");
  const [method, setMethod] = useState("UPI");

  async function process() {
    setPhase("processing");
    await new Promise((r) => setTimeout(r, 1500));
    const res = await fetch("/api/payments/mock", {
      method: "POST",
      body: JSON.stringify({ invoiceId, amount, method }),
    });
    if (res.ok) {
      const data = await res.json();
      setPhase("success");
      await new Promise((r) => setTimeout(r, 1000));
      setOpen(false); setPhase("select");
      toast.success(`Payment captured · receipt ${data.receiptNo}`, { description: `${inr(amount)} via ${method}` });
      router.refresh();
    } else {
      toast.error("Payment failed");
      setPhase("select");
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary"><CreditCard className="w-4 h-4" /> Pay {inr(amount)}</button>
      {open && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-medium">Razorpay Checkout (mock)</h2>
              <div className="text-sm text-slate-500">Amount due: <strong>{inr(amount)}</strong></div>
            </div>
            {phase === "select" && (
              <div className="p-5 space-y-3">
                <div className="text-xs uppercase tracking-wider text-slate-500">Pay using</div>
                {["UPI","CARD","NETBANKING","CASH","CHEQUE"].map((m) => (
                  <label key={m} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${method === m ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:bg-slate-50"}`}>
                    <input type="radio" name="m" checked={method === m} onChange={() => setMethod(m)} />
                    <span className="text-sm font-medium">{m}</span>
                  </label>
                ))}
                <div className="flex gap-2 justify-end pt-2">
                  <button onClick={() => setOpen(false)} className="btn-outline">Cancel</button>
                  <button onClick={process} className="btn-primary">Pay {inr(amount)}</button>
                </div>
              </div>
            )}
            {phase === "processing" && (
              <div className="p-10 text-center">
                <Loader2 className="w-10 h-10 mx-auto animate-spin text-brand-600" />
                <div className="mt-4 text-sm text-slate-600">Talking to Razorpay…</div>
              </div>
            )}
            {phase === "success" && (
              <div className="p-10 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
                <div className="mt-3 text-sm font-medium">Payment captured</div>
                <div className="text-xs text-slate-500 mt-1">Receipt generated</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
