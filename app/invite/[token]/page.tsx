import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/tokens";
import AcceptInviteForm from "./AcceptInviteForm";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await prisma.authToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { school: true },
  });

  if (!row || row.type !== "INVITE") notFound();

  const expired = row.expiresAt < new Date();
  const used = !!row.usedAt;
  const meta = (row.meta ?? {}) as { role?: string; name?: string };

  if (expired || used) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Invitation {used ? "already used" : "expired"}</h1>
          <p className="text-sm text-slate-500 mt-2">
            {used
              ? "This invitation has already been accepted."
              : "This invitation link has expired. Ask an admin to send a new one."}
          </p>
          <div className="mt-6">
            <Link href="/login" className="text-brand-700 hover:underline">Go to sign in</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome to {row.school?.name ?? "Vidyalaya"}</h1>
        <p className="text-sm text-slate-500 mt-1.5">
          Hi <strong>{meta.name}</strong> — set a password to activate your <strong>{meta.role}</strong> account
          for <strong>{row.email}</strong>.
        </p>
        <AcceptInviteForm token={token} />
      </div>
    </main>
  );
}
