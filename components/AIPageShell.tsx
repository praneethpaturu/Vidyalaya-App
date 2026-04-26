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

// Common chrome for every AI feature page: title + LLM-status banner + body.
// Doesn't replace the global Shell — sits inside the existing /Home/AI route.
export default function AIPageShell({ title, subtitle, badge, needsLLM, children }: Props) {
  const hasLLM = llmConfigured();
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1">
        <Link href="/Home" className="hover:underline">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/Home/AI" className="hover:underline">AI Insights</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-700">{title}</span>
      </nav>

      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="h-page flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-mcb-orange" /> {title}
          </h1>
          {subtitle && <p className="muted mt-0.5">{subtitle}</p>}
        </div>
        {badge && (
          <span className="badge-slate text-[11px] px-2 py-1">{badge}</span>
        )}
      </div>

      {needsLLM && !hasLLM && (
        <div className="card card-pad mb-4 border-amber-200 bg-amber-50/60">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-900">
              <div className="font-medium">Running in stub mode</div>
              <div>
                Set <code className="font-mono">ANTHROPIC_API_KEY</code> in <code className="font-mono">.env</code> to switch this page from deterministic stubs to live Claude responses. Output shape stays identical.
              </div>
            </div>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
