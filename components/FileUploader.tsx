"use client";
import { useRef, useState } from "react";
import { Paperclip, Loader2, FileText, X } from "lucide-react";
import { toast } from "sonner";

export type UploadedFile = { id: string; url: string; filename: string; mimeType: string; size: number };

export default function FileUploader({
  ownerEntity, ownerId, kind = "OTHER", onUploaded, attached = [],
}: {
  ownerEntity?: string; ownerId?: string; kind?: string;
  onUploaded?: (f: UploadedFile) => void;
  attached?: UploadedFile[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<UploadedFile[]>(attached);
  const [err, setErr] = useState<string | null>(null);

  async function handle(file: File) {
    setBusy(true); setErr(null);
    const fd = new FormData();
    fd.append("file", file);
    if (ownerEntity) fd.append("ownerEntity", ownerEntity);
    if (ownerId) fd.append("ownerId", ownerId);
    fd.append("kind", kind);
    try {
      const res = await fetch("/api/files/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Upload failed");
      const f: UploadedFile = j.file;
      setItems((s) => [...s, f]);
      onUploaded?.(f);
      toast.success(`Uploaded ${f.filename}`);
    } catch (e: any) {
      setErr(e.message);
      toast.error(`Upload failed: ${e.message}`);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <input ref={inputRef} type="file" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }} />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
          className="btn-tonal">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          {busy ? "Uploading…" : "Attach file"}
        </button>
        {err && <span className="text-xs text-rose-600">{err}</span>}
      </div>
      {items.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {items.map((f) => (
            <li key={f.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white">
              <FileText className="w-4 h-4 text-rose-600" />
              <a href={f.url} target="_blank" className="text-sm flex-1 truncate hover:underline">{f.filename}</a>
              <span className="text-xs text-slate-500">{(f.size / 1024).toFixed(1)} KB</span>
              <button type="button" onClick={() => setItems((s) => s.filter((x) => x.id !== f.id))}
                className="p-1 text-slate-400 hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
