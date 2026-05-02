"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setErr("Passwords don't match."); return; }
    setLoading(true);
    const res = await fetch(`/api/invites/${encodeURIComponent(token)}/accept`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password, phone }),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) {
      setLoading(false);
      setErr(
        data.error === "invalid-token" ? "This invitation is invalid or expired."
        : data.error === "weak-password" ? "Password must be at least 8 characters."
        : data.error === "already-member" ? "This email already has an account. Try signing in instead."
        : "Couldn't activate your account. Please try again."
      );
      return;
    }
    // Sign the new user straight in.
    const signed = await signIn("credentials", { email: data.email, password, redirect: false });
    setLoading(false);
    if (signed?.error) { router.push("/login"); return; }
    router.push("/");
    router.refresh();
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
      />
      <Input
        label="Phone (optional)"
        type="tel"
        autoComplete="tel"
        placeholder="+91 ..."
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={err ?? undefined}
      />
      <Button type="submit" loading={loading} fullWidth size="lg">
        {loading ? "Activating…" : "Activate account"}
      </Button>
    </form>
  );
}
