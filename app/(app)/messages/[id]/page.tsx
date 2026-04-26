import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDateTime } from "@/lib/utils";
import { ArrowLeft, Mail, MessageSquare, Bell, Smartphone } from "lucide-react";

export default async function MessageDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const u = session!.user as any;
  const m = await prisma.messageOutbox.findUnique({ where: { id } });
  if (!m || m.schoolId !== u.schoolId) notFound();

  const Icon = m.channel === "EMAIL" ? Mail : m.channel === "SMS" ? MessageSquare : m.channel === "PUSH" ? Smartphone : Bell;
  const accent = m.channel === "EMAIL" ? "text-brand-700 bg-brand-50" :
                 m.channel === "SMS" ? "text-emerald-700 bg-emerald-50" :
                 m.channel === "PUSH" ? "text-amber-700 bg-amber-50" :
                 "text-slate-700 bg-slate-100";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/messages" className="text-sm text-brand-700 hover:underline flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" /> Outbox</Link>

      {/* Email-client-style preview */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500">{m.channel} · {m.template ?? "—"}</div>
            <h1 className="text-lg font-medium mt-0.5">{m.subject ?? "(no subject)"}</h1>
            <div className="text-xs text-slate-500 mt-1">
              To {m.toEmail ?? m.toPhone ?? m.toUserId ?? "—"} · {fmtDateTime(m.queuedAt)}
            </div>
          </div>
          <div>
            {m.status === "SENT" ? <span className="badge-green">Sent</span>
              : m.status === "FAILED" ? <span className="badge-red">Failed</span>
              : <span className="badge-amber">{m.status}</span>}
          </div>
        </div>
        <div className="p-6 bg-slate-50/50 whitespace-pre-line text-sm text-slate-800 leading-relaxed font-sans">{m.body}</div>
        {m.providerRef && <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-500">Provider ref: <code className="font-mono">{m.providerRef}</code></div>}
        {m.error && <div className="px-5 py-3 border-t border-slate-100 text-xs text-rose-700">Error: {m.error}</div>}
      </div>

      <div className="text-xs text-slate-500 mt-3">
        Demo note: the email/SMS provider is currently the console logger. Subject, body, recipient and status mirror what would be sent through SES / Twilio in production.
      </div>
    </div>
  );
}
