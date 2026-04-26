"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Bus, Wallet, Box, Users, BookOpen } from "lucide-react";

const DEMO_ACCOUNTS = [
  { role: "Admin",        email: "admin@dpsbangalore.edu.in",  pwd: "demo1234", icon: GraduationCap, hint: "Full access" },
  { role: "Principal",    email: "principal@dpsbangalore.edu.in", pwd: "demo1234", icon: GraduationCap, hint: "School oversight" },
  { role: "Teacher",      email: "ananya.iyer@dpsbangalore.edu.in", pwd: "demo1234", icon: BookOpen, hint: "Class teacher, Grade 8-A" },
  { role: "Student",      email: "aarav.sharma@dpsbangalore.edu.in", pwd: "demo1234", icon: Users, hint: "Grade 8-A" },
  { role: "Parent",       email: "rajesh.sharma@gmail.com",      pwd: "demo1234", icon: Users, hint: "Aarav's father" },
  { role: "Accountant",   email: "accounts@dpsbangalore.edu.in", pwd: "demo1234", icon: Wallet, hint: "Fees & payroll" },
  { role: "Transport",    email: "transport@dpsbangalore.edu.in", pwd: "demo1234", icon: Bus, hint: "Buses & GPS" },
  { role: "Inventory/HR", email: "hr@dpsbangalore.edu.in", pwd: "demo1234", icon: Box, hint: "Stock & staff" },
];

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e?: React.FormEvent, override?: { email: string; pwd: string }) {
    e?.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email: override?.email ?? email,
      password: override?.pwd ?? pwd,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) { setErr("Wrong email or password."); return; }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-medium text-slate-900">Sign in</h1>
      <p className="muted mt-1">Use a demo account or your school credentials.</p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <div>
          <label className="label">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="you@school.edu.in" />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" value={pwd} onChange={(e) => setPwd(e.target.value)} required type="password" placeholder="••••••••" />
        </div>
        {err && <div className="text-sm text-rose-600">{err}</div>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="my-7 flex items-center gap-3 text-xs text-slate-500">
        <div className="flex-1 h-px bg-slate-200" /> One-tap demo accounts <div className="flex-1 h-px bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {DEMO_ACCOUNTS.map((a) => (
          <button
            key={a.email}
            onClick={() => submit(undefined, { email: a.email, pwd: a.pwd })}
            className="flex items-start gap-2.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/50 px-3 py-2.5 text-left transition"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
              <a.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-800">{a.role}</div>
              <div className="text-[11px] text-slate-500 truncate">{a.hint}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="text-xl font-medium">MyClassBoard</div>
        </div>
        <div>
          <div className="text-4xl font-medium leading-tight">One platform.<br/>Every school workflow.</div>
          <p className="mt-4 text-brand-100 max-w-md">
            SIS, HR, Finance, Admissions, Visitor, Hostel, Transport, Library, Online Exams, LMS, Connect, Gradebook —
            built for Indian schools.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {[
              { icon: BookOpen, label: "LMS" },
              { icon: Bus, label: "Transport" },
              { icon: Wallet, label: "Fees" },
              { icon: Users, label: "Attendance" },
              { icon: Box, label: "Inventory" },
              { icon: GraduationCap, label: "Payroll" },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-white/10 backdrop-blur px-3 py-3 text-center">
                <m.icon className="w-5 h-5 mx-auto mb-1.5" />
                <div className="text-xs">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-brand-200">
          Demo build · Mock GPS & payments enabled
        </div>
      </div>

      {/* Right: login form + demo accounts */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10 bg-white">
        <Suspense fallback={<div className="text-sm text-slate-500">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
