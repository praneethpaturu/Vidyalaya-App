// Reusable Connect module page (SMS / WhatsApp / Email / Voice).
// Shows credits / templates / campaigns / DLT info.

import Link from "next/link";
import { prisma } from "@/lib/db";

type Props = {
  channel: "SMS" | "WHATSAPP" | "EMAIL" | "VOICE";
  schoolId: string;
  title: string;
  blurb: string;
};

export default async function ConnectModule({ channel, schoolId, title, blurb }: Props) {
  const [providers, templates, campaigns] = await Promise.all([
    prisma.connectProvider.findMany({ where: { schoolId, channel } }),
    prisma.connectTemplate.findMany({ where: { schoolId, channel, active: true } }),
    prisma.connectCampaign.findMany({ where: { schoolId, channel }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const totalCredits = providers.reduce((s, p) => s + p.credits, 0);
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">{title}</h1>
          <p className="muted">{blurb}</p>
        </div>
        <button className="btn-primary">+ New campaign</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="card card-pad">
          <div className="text-sm font-medium">Providers</div>
          <ul className="mt-2 text-sm divide-y divide-slate-100">
            {providers.length === 0 && <li className="py-2 text-slate-500">None configured.</li>}
            {providers.map((p) => (
              <li key={p.id} className="py-2 flex items-center justify-between">
                <span>{p.name} {p.senderId ? <span className="text-xs text-slate-500">· {p.senderId}</span> : null}</span>
                <span className={p.active ? "badge-green" : "badge-slate"}>{p.active ? "Active" : "Inactive"}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card card-pad">
          <div className="text-sm font-medium">Credits balance</div>
          <div className="text-3xl font-medium tracking-tight mt-1">{totalCredits.toLocaleString()}</div>
          <button className="btn-tonal text-xs px-3 py-1 mt-2">Recharge</button>
        </div>
        {channel === "SMS" && (
          <div className="card card-pad">
            <div className="text-sm font-medium">DLT compliance (India)</div>
            <ul className="mt-2 text-xs text-slate-600 space-y-1">
              <li>Entity ID: <span className="font-mono">DLT-{schoolId.slice(0, 6).toUpperCase()}</span></li>
              <li>Templates approved: {templates.filter((t) => t.approved).length}</li>
              <li>Pending approval: {templates.filter((t) => !t.approved).length}</li>
            </ul>
          </div>
        )}
        {channel === "WHATSAPP" && (
          <div className="card card-pad">
            <div className="text-sm font-medium">Meta WhatsApp Cloud</div>
            <ul className="mt-2 text-xs text-slate-600 space-y-1">
              <li>Approved templates: {templates.filter((t) => t.approved).length}</li>
              <li>Two-way chat: licensed (demo)</li>
              <li>Opt-in tracking: parents auto opt-in via app</li>
            </ul>
          </div>
        )}
        {channel === "EMAIL" && (
          <div className="card card-pad">
            <div className="text-sm font-medium">SMTP</div>
            <ul className="mt-2 text-xs text-slate-600 space-y-1">
              <li>From: noreply@school.in</li>
              <li>Bounce rate: 0.3%</li>
              <li>Templates: {templates.length}</li>
            </ul>
          </div>
        )}
        {channel === "VOICE" && (
          <div className="card card-pad">
            <div className="text-sm font-medium">Voice / IVR</div>
            <ul className="mt-2 text-xs text-slate-600 space-y-1">
              <li>TTS engine: Default</li>
              <li>Retry rule: 3 attempts, 5 min apart</li>
              <li>Languages: English, Hindi, Kannada</li>
            </ul>
          </div>
        )}
      </div>

      <h2 className="h-section mb-2">Templates</h2>
      <div className="card overflow-x-auto mb-5">
        <table className="table">
          <thead><tr><th>Name</th><th>Approved</th><th>Category</th><th>Body preview</th></tr></thead>
          <tbody>
            {templates.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-6">No templates</td></tr>}
            {templates.map((t) => (
              <tr key={t.id}>
                <td className="font-medium">{t.name}</td>
                <td>{t.approved ? <span className="badge-green">Yes</span> : <span className="badge-amber">Pending</span>}</td>
                <td>{t.category ?? "—"}</td>
                <td className="text-xs text-slate-600 truncate max-w-md">{t.body}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="h-section mb-2">Recent campaigns</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Name</th><th>Recipients</th><th>Delivered</th><th>Failed</th><th>Status</th><th>Sent</th></tr></thead>
          <tbody>
            {campaigns.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-6">No campaigns</td></tr>}
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.name}</td>
                <td>{c.recipients}</td>
                <td className="text-emerald-700">{c.delivered}</td>
                <td className="text-rose-600">{c.failed}</td>
                <td>
                  <span className={
                    c.status === "SENT" ? "badge-green"
                      : c.status === "SENDING" ? "badge-blue"
                      : c.status === "FAILED" ? "badge-red"
                      : c.status === "SCHEDULED" ? "badge-amber"
                      : "badge-slate"
                  }>{c.status}</span>
                </td>
                <td className="text-xs">{c.sentAt ? new Date(c.sentAt).toLocaleString("en-IN") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
