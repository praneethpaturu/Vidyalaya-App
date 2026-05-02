"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Errors = Record<string, string>;

export default function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    schoolName: "",
    schoolCode: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    schoolEmail: "",
    adminName: "",
    adminEmail: "",
    password: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [globalErr, setGlobalErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setGlobalErr(null);
    setLoading(true);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!data?.ok) {
      setLoading(false);
      if (data?.fields) setErrors(data.fields);
      if (data?.error === "bad-json") setGlobalErr("Couldn't process that. Please try again.");
      else if (!data?.fields) setGlobalErr(data?.error ?? "Couldn't create your school. Please try again.");
      return;
    }
    // Sign the new admin in directly so they land in the app already authed.
    const signed = await signIn("credentials", {
      email: form.adminEmail.toLowerCase().trim(),
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (signed?.error) {
      // The school was created; just send them to /login.
      router.push("/login?next=/");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-6" noValidate>
      <fieldset className="space-y-3">
        <legend className="text-xs uppercase tracking-wider text-slate-500 mb-1">
          About your school
        </legend>
        <Input label="School name" required value={form.schoolName} onChange={set("schoolName")}
               error={errors.schoolName} placeholder="Lakshya School of Excellence" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="School code" required value={form.schoolCode} onChange={set("schoolCode")}
                 error={errors.schoolCode} placeholder="LSE001" autoCapitalize="characters" />
          <Input label="Phone" required value={form.phone} onChange={set("phone")}
                 error={errors.phone} placeholder="+91 80 1234 5678" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="City" required value={form.city} onChange={set("city")} error={errors.city} placeholder="Bangalore" />
          <Input label="State" required value={form.state} onChange={set("state")} error={errors.state} placeholder="Karnataka" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="PIN code" required value={form.pincode} onChange={set("pincode")} error={errors.pincode} placeholder="560001" maxLength={6} />
          <Input label="School email" type="email" required value={form.schoolEmail} onChange={set("schoolEmail")}
                 error={errors.schoolEmail} placeholder="office@school.edu.in" />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-xs uppercase tracking-wider text-slate-500 mb-1">
          Your administrator account
        </legend>
        <Input label="Your name" required value={form.adminName} onChange={set("adminName")}
               error={errors.adminName} placeholder="Pradeep Kumar" autoComplete="name" />
        <Input label="Your email" type="email" required value={form.adminEmail} onChange={set("adminEmail")}
               error={errors.adminEmail} placeholder="you@school.edu.in" autoComplete="email" />
        <Input label="Password" type="password" required minLength={8} value={form.password} onChange={set("password")}
               error={errors.password} placeholder="At least 8 characters" autoComplete="new-password" />
      </fieldset>

      {globalErr && (
        <div className="text-sm rounded-lg bg-rose-50 text-rose-800 px-3 py-2">{globalErr}</div>
      )}

      <Button type="submit" loading={loading} fullWidth size="lg">
        {loading ? "Setting up…" : "Create school + admin account"}
      </Button>
      <p className="text-xs text-slate-500">
        By creating a school, you agree to follow your school's data-protection policies and to
        not enter real student data until you've configured access controls. We'll send a
        verification link to your administrator email.
      </p>
    </form>
  );
}
