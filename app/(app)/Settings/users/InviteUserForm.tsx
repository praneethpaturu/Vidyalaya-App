"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const ROLES = [
  "TEACHER", "STUDENT", "PARENT",
  "ACCOUNTANT", "HR_MANAGER", "TRANSPORT_MANAGER", "INVENTORY_MANAGER",
  "PRINCIPAL", "ADMIN",
];

export default function InviteUserForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("TEACHER");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, name, role }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!data.ok) {
      const map: Record<string, string> = {
        "invalid-email": "That doesn't look like a valid email.",
        "missing-name": "Please enter the person's name.",
        "invalid-role": "Pick a valid role.",
        "already-member": "That email already has an account here.",
        "email-taken": "That email is registered to another school.",
        "forbidden": "You don't have permission to invite users.",
      };
      setMsg({ kind: "err", text: map[data.error] ?? "Couldn't send invitation. Please try again." });
      return;
    }
    setMsg({ kind: "ok", text: `Invitation sent to ${email}.` });
    setEmail(""); setName(""); setRole("TEACHER");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
      <Input label="Full name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ananya Iyer" />
      <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ananya@school.edu.in" />
      <label className="block text-sm">
        <span className="text-slate-700">Role</span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>
      {msg && (
        <div className={`text-sm rounded-lg px-3 py-2 ${msg.kind === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
          {msg.text}
        </div>
      )}
      <Button type="submit" loading={loading} fullWidth>
        {loading ? "Sending…" : "Send invitation"}
      </Button>
    </form>
  );
}
