import Link from "next/link";
import { ChevronRight, Sparkles, AlertTriangle } from "lucide-react";
import { llmConfigured } from "@/lib/ai";

type Props = {
  title: string;
  subtitle?: string;
  badge?: string;
  needsLLM?: boolean;
  children: React.ReactNode;
};

// Common chrome for every AI feature page: breadcrumb + title + LLM-status
// banner + body. Sits inside the global Shell — does not replace it.
export default function AIPageShell({ title, subtitle, badge, needsLLM, children }: Props) {
  const hasLLM = llmConfigured();
  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      <nav aria-label="Breadcrumb" className="mb-3">
        <ol className="text-xs text-slate-500 flex items-center gap-1.5">
          <li><Link href="/Home" className="hover:text-slate-700 transition-colors">Home</Link></li>
          <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
          <li><Link href="/Home/AI" className="hover:text-slate-700 transition-colors">AI Insights</Link></li>
          <li aria-hidden="true"><ChevronRight className="w-3 h-3" /></li>
          <li className="text-slate-800 font-medium">{title}</li>
        </ol>
      </nav>

      <header className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 font-display flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-sm">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </span>
            {title}
          </h1>
          {subtitle && <p className="text-sm text-slate-500 mt-1.5 max-w-3xl leading-relaxed">{subtitle}</p>}
        </div>
        {badge && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200 shrink-0">
            {badge}
          </span>
        )}
      </header>

      {needsLLM && !hasLLM && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 mb-5 flex items-start gap-3"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <div className="font-semibold">Running in stub mode</div>
            <div>
              Set <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">OPENAI_API_KEY</code> in
              your environment to switch this page from deterministic stubs to live LLM responses. The
              output shape stays identical.
            </div>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
