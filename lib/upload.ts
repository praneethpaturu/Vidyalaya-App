// File storage backed by Supabase Storage.
//
// Bucket layout: <schoolId>/<yyyy-mm>/<id>-<filename>
// Public URLs go through the existing /api/files/[...] route, which now
// redirects to a signed Supabase URL (bucket is private).
//
// The function signatures (saveLocal / readLocal / StoredFile) stay
// identical so callers (server actions, API routes) don't change.

import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = process.env.SUPABASE_BUCKET ?? "uploads";

// Lazy-init so a missing env var only errors when uploads are actually used,
// not at module-load. (Lets static pages render in environments where uploads
// are disabled.)
let _client: ReturnType<typeof createClient> | null = null;
function client() {
  if (_client) return _client;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase storage not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return _client;
}

export type StoredFile = {
  storagePath: string; // bucket-relative
  url: string;         // public URL through /api/files/[...]
  size: number;
  mimeType: string;
  filename: string;
};

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "text/plain", "text/csv", "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export function sanitiseName(name: string) {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120);
}

export async function saveLocal(schoolId: string, file: File): Promise<StoredFile> {
  if (file.size > MAX_BYTES) throw new Error(`File too large (>${MAX_BYTES / 1024 / 1024} MB)`);
  if (!ALLOWED_MIME.has(file.type)) throw new Error(`Unsupported type: ${file.type}`);

  const yyyymm = new Date().toISOString().slice(0, 7);
  const id = crypto.randomBytes(8).toString("hex");
  const safeName = sanitiseName(file.name);
  const filename = `${id}-${safeName}`;
  const storagePath = `${schoolId}/${yyyymm}/${filename}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error } = await client()
    .storage.from(BUCKET)
    .upload(storagePath, buf, {
      contentType: file.type,
      upsert: false,
    });
  if (error) throw new Error(`upload failed: ${error.message}`);

  const url = `/api/files/${encodeURIComponent(schoolId)}/${yyyymm}/${encodeURIComponent(filename)}`;
  return { storagePath, url, size: file.size, mimeType: file.type, filename: safeName };
}

export async function readLocal(storagePath: string): Promise<{ buf: Buffer; absPath: string }> {
  const safe = storagePath.replace(/\\/g, "/").replace(/\.\.\//g, "");
  const { data, error } = await client().storage.from(BUCKET).download(safe);
  if (error || !data) throw new Error(`download failed: ${error?.message ?? "no data"}`);
  const arr = await data.arrayBuffer();
  return { buf: Buffer.from(arr), absPath: safe };
}

// Generate a short-lived signed URL — used by the /api/files/[...] route to
// hand the browser a direct CDN link without exposing the service role key.
export async function signedUrl(storagePath: string, expiresInSec = 60): Promise<string> {
  const safe = storagePath.replace(/\\/g, "/").replace(/\.\.\//g, "");
  const { data, error } = await client()
    .storage.from(BUCKET)
    .createSignedUrl(safe, expiresInSec);
  if (error || !data) throw new Error(`sign failed: ${error?.message ?? "no data"}`);
  return data.signedUrl;
}
