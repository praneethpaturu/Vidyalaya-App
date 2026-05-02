"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Forgot your password?</h1>
        <p className="text-sm text-slate-500 mt-1.5">Enter your email and we'll send you a reset link.</p>

        {sent ? (
          <div className="mt-6 rounded-xl border border-slate-200 p-4 text-sm text-slate-700">
            If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox (and spam folder).
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@school.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" loading={loading} fullWidth size="lg">
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-sm">
          <Link href="/login" className="text-brand-700 hover:underline">Back to sign in</Link>
        </div>
      </div>
    </main>
  );
}
