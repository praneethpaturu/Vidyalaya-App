"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import FileUploader, { type UploadedFile } from "./FileUploader";

export default function StudentTurnIn({
  submissionId, assignmentId, status, attachments, dueDate, feedback, grade, maxPoints,
}: {
  submissionId: string;
  assignmentId: string;
  status: string;
  attachments: UploadedFile[];
  dueDate: string | null;
  feedback?: string | null;
  grade?: number | null;
  maxPoints: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [files, setFiles] = useState<UploadedFile[]>(attachments);
  const [busy, setBusy] = useState(false);

  async function turnIn() {
    setBusy(true);
    const r = await fetch("/api/lms/turn-in", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, assignmentId, fileIds: files.map((f) => f.id) }),
    });
    setBusy(false);
    if (r.ok) { toast.success("Turned in"); start(() => router.refresh()); }
    else toast.error("Failed to turn in");
  }
  async function unsubmit() {
    setBusy(true);
    const r = await fetch("/api/lms/turn-in", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, assignmentId, action: "UNSUBMIT" }),
    });
    setBusy(false);
    if (r.ok) { toast("Unsubmitted"); start(() => router.refresh()); }
    else toast.error("Failed");
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="font-medium">Your work</div>
        <div className="text-sm text-slate-500">Due {dueDate ?? "—"}</div>
      </div>

      {status === "GRADED" || status === "TURNED_IN" ? (
        <div className="mt-3">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200">
              <FileText className="w-4 h-4 text-rose-600" />
              <a href={f.url} target="_blank" className="text-sm hover:underline">{f.filename}</a>
            </div>
          ))}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-emerald-700 text-sm font-medium">
              {status === "GRADED" ? `Graded — ${grade}/${maxPoints}` : "Turned in"}
            </span>
            {status === "TURNED_IN" && (
              <button onClick={unsubmit} className="btn-outline" disabled={busy}>
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}Unsubmit
              </button>
            )}
          </div>
          {feedback && (
            <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="text-xs font-medium text-emerald-800">Teacher feedback</div>
              <div className="text-sm text-emerald-900 mt-1">{feedback}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <FileUploader
            ownerEntity="Submission"
            ownerId={submissionId}
            kind="SUBMISSION"
            attached={files}
            onUploaded={(f) => setFiles((s) => [...s, f])}
          />
          <button onClick={turnIn} className="btn-primary w-full" disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Turn in
          </button>
        </div>
      )}
    </div>
  );
}
