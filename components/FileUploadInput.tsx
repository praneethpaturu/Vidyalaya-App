"use client";

import { useRef, useState } from "react";
import { Upload, X, CheckCircle2 } from "lucide-react";

// Reusable file picker that POSTs to /api/files/upload and writes the resulting
// public URL back into a sibling hidden input. Drop into any form like:
//
//   <FileUploadInput name="resumeUrl" accept="application/pdf,image/*" kind="RESUME" />
//
// On submit, the form sees `name` carrying the URL string. While uploading,
// the component disables the form via aria-busy + a wrapper div spinner so
// the user can't double-submit.

type Props = {
  name: string;                          // hidden field name (the URL goes here)
  accept?: string;                       // input[type=file] accept
  kind?: string;                         // FileAsset.kind tag
  ownerEntity?: string;
  ownerId?: string;
  defaultUrl?: string | null;            // pre-existing URL (edit mode)
  label?: string;                        // upload button label
  className?: string;
};

export default function FileUploadInput({
  name, accept, kind = "OTHER", ownerEntity, ownerId, defaultUrl, label = "Upload file", className,
}: Props) {
  const [url, setUrl] = useState<string>(defaultUrl ?? "");
  const [filename, setFilename] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("kind", kind);
      if (ownerEntity) fd.append("ownerEntity", ownerEntity);
      if (ownerId) fd.append("ownerId", ownerId);
      const r = await fetch("/api/files/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (!data?.ok) throw new Error(data?.error ?? "Upload failed");
      setUrl(data.file.url);
      setFilename(data.file.filename);
    } catch (e: any) {
      setError(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function clear() {
    setUrl("");
    setFilename("");
    setError(null);
  }

  return (
    <div className={className ?? "space-y-1.5"}>
      <input type="hidden" name={name} value={url} />
      {!url && (
        <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-sm ${busy ? "opacity-60 cursor-wait" : ""}`}>
          <Upload className="w-4 h-4" />
          <span>{busy ? "Uploading…" : label}</span>
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            onChange={onChange}
            disabled={busy}
            className="hidden"
          />
        </label>
      )}
      {url && (
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline truncate max-w-[280px]">
            {filename || url}
          </a>
          <button type="button" onClick={clear} className="text-slate-400 hover:text-rose-700" aria-label="Remove">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {error && <div className="text-xs text-rose-700">{error}</div>}
    </div>
  );
}
