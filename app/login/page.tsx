"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Bus, Wallet, Box, Users, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { trackEvent } from "@/lib/analytics";

const DEMO_ACCOUNTS = [
  { role: "Admin",        email: "admin@dpsbangalore.edu.in",        pwd: "demo1234", icon: GraduationCap, hint: "Full access" },
  { role: "Principal",    email: "principal@dpsbangalore.edu.in",    pwd: "demo1234", icon: GraduationCap, hint: "School oversight" },
  { role: "Teacher",      email: "ananya.iyer@dpsbangalore.edu.in",  pwd: "demo1234", icon: BookOpen,      hint: "Class teacher · Grade 8-A" },
  { role: "Student",      email: "aarav.sharma@dpsbangalore.edu.in", pwd: "demo1234", icon: Users,         hint: "Grade 8-A" },
  { role: "Parent",       email: "rajesh.sharma@gmail.com",          pwd: "demo1234", icon: Users,         hint: "Aarav's father" },
  { role: "Accountant",   email: "accounts@dpsbangalore.edu.in",     pwd: "demo1234", icon: Wallet,        hint: "Fees & payroll" },
  { role: "Transport",    email: "transport@dpsbangalore.edu.in",    pwd: "demo1234", icon: Bus,           hint: "Buses & GPS" },
  { role: "Inventory/HR", email: "hr@dpsbangalore.edu.in",           pwd: "demo1234", icon: Box,           hint: "Stock & staff" },
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
    // Track login — record role only, never raw email
    const role = override
      ? DEMO_ACCOUNTS.find((a) => a.email === override.email)?.role ?? "Other"
      : "Custom";
    trackEvent("login_success", { role, via: override ? "demo-grid" : "form" });
    router.push(next);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 font-display">Welcome back</h1>
      <p className="text-sm text-slate-500 mt-1.5">Use a demo account below, or your school credentials.</p>

      <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@school.edu.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          error={err ?? undefined}
        />
        <Button type="submit" loading={loading} fullWidth size="lg" iconRight={<ArrowRight className="w-4 h-4" />}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="my-7 flex items-center gap-3 text-[11px] uppercase tracking-wider text-slate-400">
        <div className="flex-1 h-px bg-slate-200" />
        <span>or pick a role</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {DEMO_ACCOUNTS.map((a) => (
          <button
            key={a.email}
            type="button"
            onClick={() => submit(undefined, { email: a.email, pwd: a.pwd })}
            disabled={loading}
            className="group flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition-all duration-200 hover:border-brand-300 hover:bg-brand-50/40 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:shadow-focus"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center shrink-0 transition-colors group-hover:bg-brand-100">
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
    <div className="min-h-screen grid lg:grid-cols-[1fr_minmax(0,560px)] bg-white relative">
      {/* Language switcher — top right of the entire login screen */}
      <div className="absolute top-4 right-4 lg:top-6 lg:right-6 z-30">
        <LanguageSwitcher />
      </div>
      {/* Left: brand panel */}
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 text-white relative overflow-hidden">
        {/* Soft decorative blobs */}
        <div aria-hidden="true" className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-accent-500/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
            <GraduationCap className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <div className="text-xl font-semibold tracking-tight font-display">Vidyalaya</div>
            <div className="text-[11px] text-brand-200 -mt-0.5">School Suite</div>
          </div>
        </div>

        <div className="relative">
          <div className="text-[42px] leading-[1.05] font-semibold tracking-tight font-display">
            One platform.<br/>
            <span className="text-brand-200">Every school workflow.</span>
          </div>
          <p className="mt-5 text-brand-100/90 max-w-md text-[15px] leading-relaxed">
            SIS · HR · Finance · Admissions · Hostel · Transport · Library · Online Exams · LMS · Connect — with
            AI insights woven through.
          </p>
          <div className="mt-9 grid grid-cols-3 gap-3 max-w-md">
            {[
              { icon: BookOpen,    label: "LMS" },
              { icon: Bus,         label: "Transport" },
              { icon: Wallet,      label: "Fees" },
              { icon: Users,       label: "Attendance" },
              { icon: Box,         label: "Inventory" },
              { icon: GraduationCap, label: "Payroll" },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-white/10 backdrop-blur px-3 py-3 text-center ring-1 ring-white/10 hover:bg-white/15 transition-colors">
                <m.icon className="w-5 h-5 mx-auto mb-1.5" aria-hidden="true" />
                <div className="text-xs">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-brand-200">
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Demo environment · mock GPS &amp; payments enabled</span>
        </div>
      </aside>

      {/* Right: login form */}
      <main className="flex flex-col items-center justify-center p-6 sm:p-10 lg:p-14">
        {/* Mobile logo (only when brand panel is hidden) */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-brand-700 text-white flex items-center justify-center">
            <GraduationCap className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900">Vidyalaya</div>
            <div className="text-[11px] text-slate-500 -mt-0.5">School Suite</div>
          </div>
        </div>

        <Suspense fallback={<div className="text-sm text-slate-500">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
