import Link from "next/link";
import SignupForm from "./SignupForm";

export const metadata = { title: "Get started — Vidyalaya" };

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Set up your school on Vidyalaya
        </h1>
        <p className="text-sm text-slate-500 mt-1.5">
          Creates a tenant for your school and your first administrator account. Takes about
          a minute. You can invite teachers, parents, and staff once you're signed in.
        </p>
        <SignupForm />
        <div className="mt-8 text-sm text-slate-500">
          Already have an account? <Link href="/login" className="text-brand-700 hover:underline">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
