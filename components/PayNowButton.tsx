"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { inr } from "@/lib/utils";
import { toast } from "sonner";

declare global { interface Window { Razorpay?: any } }

function loadRazorpaySdk(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

export default function PayNowButton({ invoiceId, amount }: { invoiceId: string; amount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"select" | "processing" | "demo" | "success" | "error">("select");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function process() {
    setPhase("processing");
    const res = await fetch("/api/payments/razorpay", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      setErrMsg(data?.error ?? "Could not create order.");
      setPhase("error");
      return;
    }
    if (data.provider === "mock") {
      // RAZORPAY_KEY_ID is unset on the server; we cannot capture money.
      // Fail loud rather than fabricate a Payment row.
      setPhase("demo");
      return;
    }
    const ok = await loadRazorpaySdk();
    if (!ok || !window.Razorpay) {
      setErrMsg("Couldn't load Razorpay checkout.");
      setPhase("error");
      return;
    }
    const rzp = new window.Razorpay({
      key: data.keyId,
      order_id: data.orderId,
      amount: data.amountPaise,
      currency: "INR",
      name: "Vidyalaya",
      description: `Invoice payment`,
      handler: async (resp: any) => {
        // Verify the signature server-side and create the Payment row.
        // Webhook (if configured) is idempotent with this — first to fire
        // wins, the other becomes a no-op via txnRef uniqueness.
        setPhase("processing");
        try {
          const v = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              invoiceId,
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            }),
          });
          const vd = await v.json().catch(() => ({}));
          if (!v.ok || !vd?.ok) {
            setErrMsg(vd?.error === "bad-signature" ? "Payment couldn't be verified."
              : vd?.error === "not-captured" ? "Payment not captured by Razorpay yet — try again in a moment."
              : "Couldn't confirm the payment.");
            setPhase("error");
            return;
          }
          setPhase("success");
          await new Promise((r) => setTimeout(r, 1200));
          setOpen(false); setPhase("select");
          toast.success(`Payment received · receipt ${vd.receiptNo}`, { description: inr(vd.amountPaid ?? amount) });
          router.refresh();
        } catch (e: any) {
          setErrMsg("Couldn't reach the server to confirm the payment.");
          setPhase("error");
        }
      },
      modal: {
        ondismiss: () => setPhase("select"),
      },
    });
    rzp.open();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary"><CreditCard className="w-4 h-4" /> Pay {inr(amount)}</button>
      {open && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-medium">Pay invoice</h2>
              <div className="text-sm text-slate-500">Amount due: <strong>{inr(amount)}</strong></div>
            </div>
            {phase === "select" && (
              <div className="p-5 space-y-3">
                <p className="text-sm text-slate-600">You'll be redirected to Razorpay's secure checkout to complete the payment.</p>
                <div className="flex gap-2 justify-end pt-2">
                  <button onClick={() => setOpen(false)} className="btn-outline">Cancel</button>
                  <button onClick={process} className="btn-primary">Continue to Razorpay</button>
                </div>
              </div>
            )}
            {phase === "processing" && (
              <div className="p-10 text-center">
                <Loader2 className="w-10 h-10 mx-auto animate-spin text-brand-600" />
                <div className="mt-4 text-sm text-slate-600">Creating order…</div>
              </div>
            )}
            {phase === "success" && (
              <div className="p-10 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
                <div className="mt-3 text-sm font-medium">Payment received</div>
                <div className="text-xs text-slate-500 mt-1">Receipt will be generated shortly</div>
              </div>
            )}
            {phase === "demo" && (
              <div className="p-6 text-sm text-slate-700 space-y-3">
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-amber-900">Razorpay isn't configured yet</div>
                    <div className="text-amber-800 text-xs mt-0.5">
                      Set <code>RAZORPAY_KEY_ID</code>, <code>RAZORPAY_KEY_SECRET</code>, and <code>RAZORPAY_WEBHOOK_SECRET</code>
                      on Vercel to enable real payments. Until then, payments cannot be captured here.
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={() => { setOpen(false); setPhase("select"); }} className="btn-primary">Close</button>
                </div>
              </div>
            )}
            {phase === "error" && (
              <div className="p-6 text-sm text-slate-700 space-y-3">
                <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-3">
                  <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-rose-900">Couldn't start payment</div>
                    <div className="text-rose-800 text-xs mt-0.5">{errMsg}</div>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={() => { setOpen(false); setPhase("select"); setErrMsg(null); }} className="btn-outline">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
