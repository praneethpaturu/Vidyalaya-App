"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

function ResetForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setErr("Passwords don't match."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!data.ok) {
      setErr(
        data.error === "invalid-token" ? "This reset link is invalid or has expired."
        : data.error === "weak-password" ? "Password must be at least 8 characters."
        : "Couldn't reset your password. Please try again."
      );
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  if (!token) {
    return <p className="text-sm text-rose-600">Missing reset token. <Link href="/forgot-password" className="underline">Request a new link</Link>.</p>;
  }

  if (done) {
    return <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700">Password updated. Redirecting to sign in…</div>;
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={err ?? undefined}
      />
      <Button type="submit" loading={loading} fullWidth size="lg">
        {loading ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Set a new password</h1>
        <Suspense fallback={<p className="text-sm text-slate-500 mt-2">Loading…</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </main>
  );
}
