"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function HpcClient({ examId, studentCount }: { examId: string; studentCount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ generated: number; errors: string[] } | null>(null);

  async function generate() {
    setBusy(true);
    setResult(null);
    try {
      const r = await fetch(`/api/hpc/${examId}/generate`, { method: "POST" });
      const data = await r.json();
      if (data?.ok) setResult({ generated: data.generated, errors: data.errors ?? [] });
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={generate} disabled={busy} className="btn-primary inline-flex items-center gap-1.5">
        <Sparkles className="w-4 h-4" />
        {busy ? `Generating for ${studentCount} students…` : `✨ Generate HPC narratives (${studentCount})`}
      </button>
      {result && (
        <div className="text-xs text-emerald-700">
          ✓ Generated {result.generated} of {studentCount}
          {result.errors.length > 0 && ` · ${result.errors.length} errors`}
        </div>
      )}
    </div>
  );
}
