import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";
import { AI_FEATURES, llmConfigured, type AiFeatureGroup } from "@/lib/ai";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

const GROUPS: { key: AiFeatureGroup; label: string; tone: string }[] = [
  { key: "Admissions", label: "Admissions",     tone: "bg-emerald-50 text-emerald-700" },
  { key: "SIS",        label: "Students (SIS)", tone: "bg-sky-50 text-sky-700" },
  { key: "HR",         label: "HR & Payroll",   tone: "bg-violet-50 text-violet-700" },
  { key: "Finance",    label: "Finance",        tone: "bg-amber-50 text-amber-700" },
  { key: "Transport",  label: "Transport",      tone: "bg-rose-50 text-rose-700" },
  { key: "Library",    label: "Library",        tone: "bg-indigo-50 text-indigo-700" },
  { key: "LMS",        label: "LMS",            tone: "bg-blue-50 text-blue-700" },
  { key: "Connect",    label: "Connect",        tone: "bg-teal-50 text-teal-700" },
  { key: "Hostel",     label: "Hostel",         tone: "bg-orange-50 text-orange-700" },
  { key: "Cross",      label: "Cross-cutting",  tone: "bg-slate-100 text-slate-700" },
];

export default async function AIHomePage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER", "HR_MANAGER", "ACCOUNTANT"]);
  const sId = u.schoolId as string;

  const [auditCount, suggestionCount, insightCount] = await Promise.all([
    prisma.aiAuditLog.count({ where: { schoolId: sId } }),
    prisma.aiSuggestion.count({ where: { schoolId: sId } }),
    prisma.aiInsight.count({ where: { schoolId: sId } }),
  ]);
  const hasLLM = llmConfigured();

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="h-page flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-mcb-orange" /> AI Insights
          </h1>
          <p className="muted mt-0.5">
            Additive ML scoring &amp; LLM helpers across the school. Existing
            screens are untouched — every feature here is opt-in.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${hasLLM ? "badge-green" : "badge-amber"}`}>
            {hasLLM ? "LLM connected" : "Stub mode"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Audit log entries" value={auditCount} />
        <Stat label="Cached insights" value={insightCount} />
        <Stat label="Suggestions awaiting review" value={suggestionCount} />
        <Stat label="Total features" value={AI_FEATURES.length} />
      </div>

      {GROUPS.map((g) => {
        const items = AI_FEATURES.filter((f) => f.group === g.key);
        if (items.length === 0) return null;
        return (
          <section key={g.key} className="mb-6">
            <h2 className="h-section mb-2">{g.label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((f) => (
                <Link
                  key={f.href}
                  href={f.href}
                  className="card card-pad hover:shadow-sm transition group"
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${g.tone}`}>
                      {g.label}
                    </div>
                    {f.needsLLM && (
                      <span className="text-[10px] text-slate-500">LLM</span>
                    )}
                  </div>
                  <div className="font-medium text-slate-800 group-hover:text-brand-700 flex items-center gap-1">
                    {f.label}
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {f.desc}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <div className="card card-pad bg-slate-50 border-dashed text-xs text-slate-600">
        <div className="font-medium text-slate-800 mb-1">How this is wired</div>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>Classical scoring (lead, at-risk, delinquency, driver, ETA, anomalies, compatibility) is deterministic — runs offline, no API needed.</li>
          <li>LLM-backed pages use Anthropic if <code>ANTHROPIC_API_KEY</code> is set, otherwise a deterministic stub so every page still renders.</li>
          <li>All AI calls are logged to <code>AiAuditLog</code> (provider, tokens, latency, errors).</li>
          <li>Results that need human review go to <code>AiSuggestion</code> with PENDING status — nothing is auto-applied.</li>
          <li>No existing module page, schema field, or action was modified.</li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card card-pad">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-2xl font-medium tracking-tight">{value}</div>
    </div>
  );
}
