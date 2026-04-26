"use client";
import { useState } from "react";
import AIPageShell from "@/components/AIPageShell";

export default function AutoTagPage() {
  const [title, setTitle] = useState("The Magic Garden");
  const [author, setAuthor] = useState("Ruskin Bond");
  const [blurb, setBlurb] = useState(
    "A young narrator discovers a mysterious neighbour and the wild garden behind her bungalow in the Mussoorie hills.",
  );
  const [tags, setTags] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/auto-tag", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, author, blurb }),
      });
      const data = await res.json();
      setTags(data.tags ?? []);
    } finally { setLoading(false); }
  }

  return (
    <AIPageShell
      title="Book Auto-tagging"
      subtitle="Suggest library tags from the book's title, author, and blurb. Librarians keep final approval."
      needsLLM
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card card-pad space-y-3">
          <div>
            <label className="text-xs text-slate-500">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-md px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Author</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)}
              className="w-full border rounded-md px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Blurb</label>
            <textarea value={blurb} onChange={(e) => setBlurb(e.target.value)}
              className="w-full border rounded-md px-2 py-1.5 text-sm h-32" />
          </div>
          <button onClick={go} disabled={loading} className="btn-primary">
            {loading ? "Tagging..." : "Suggest tags"}
          </button>
        </div>
        <div className="card card-pad">
          <div className="text-xs font-medium text-slate-500 mb-2">Suggested tags</div>
          {!tags && <div className="text-sm text-slate-500">No suggestions yet.</div>}
          {tags && tags.length === 0 && <div className="text-sm text-slate-500">Model returned no tags.</div>}
          {tags && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="badge-slate">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </AIPageShell>
  );
}
