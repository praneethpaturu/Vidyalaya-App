"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, CheckCircle2, XCircle } from "lucide-react";

type Item = { name: string; status: "queued" | "uploading" | "done" | "error"; url?: string; error?: string };

export default function BulkPhotoUpload({ albumId }: { albumId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setItems(files.map((f) => ({ name: f.name, status: "queued" })));
    upload(files);
  }

  async function upload(files: File[]) {
    setBusy(true);
    // Sequential upload — keeps the connection lighter for slow networks +
    // we get a stable progress count.
    for (let i = 0; i < files.length; i++) {
      setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, status: "uploading" } : it));
      try {
        const fd = new FormData();
        fd.append("file", files[i]);
        fd.append("kind", "PHOTO");
        fd.append("ownerEntity", "PhotoAlbum");
        fd.append("ownerId", albumId);
        const r = await fetch("/api/files/upload", { method: "POST", body: fd });
        const data = await r.json();
        if (!data?.ok) throw new Error(data?.error ?? "Upload failed");

        // Persist the Photo row immediately so the gallery refresh shows it.
        await fetch(`/api/photos/${albumId}/add`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: data.file.url, caption: "" }),
        }).catch(() => {});

        setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, status: "done", url: data.file.url } : it));
      } catch (e: any) {
        setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, status: "error", error: e?.message ?? "Failed" } : it));
      }
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-sm ${busy ? "opacity-60 cursor-wait" : ""}`}>
        <Upload className="w-4 h-4" />
        <span>{busy ? "Uploading…" : "Choose multiple photos"}</span>
        <input type="file" accept="image/*" multiple onChange={pick} disabled={busy} className="hidden" />
      </label>
      {items.length > 0 && (
        <ul className="text-xs space-y-1 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-2">
              {it.status === "uploading" && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-700" />}
              {it.status === "queued" && <span className="w-3.5 h-3.5 inline-block rounded-full bg-slate-200" />}
              {it.status === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              {it.status === "error" && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
              <span className="truncate flex-1">{it.name}</span>
              {it.error && <span className="text-rose-700 text-[10px]">{it.error}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
