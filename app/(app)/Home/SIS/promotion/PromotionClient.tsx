"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Cls = { id: string; name: string; grade: string; section: string };
type Stu = { id: string; admissionNo: string; rollNo: string; name: string; classId: string | null; className: string };

const ACTIONS: { value: string; label: string }[] = [
  { value: "PASS_AND_PROMOTION", label: "Pass & promote" },
  { value: "FINANCIAL_PROMOTION", label: "Financial promotion" },
  { value: "DETAIN", label: "Detain" },
  { value: "ALUMNI", label: "Alumni" },
  { value: "DROPOUT", label: "Dropout" },
];

export default function PromotionClient({
  fromAY, currentSchoolAY, classes, selectedClassId, students,
}: {
  fromAY: string;
  currentSchoolAY: string;
  classes: Cls[];
  selectedClassId: string;
  students: Stu[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const [classId, setClassId] = useState(selectedClassId);
  const [toAY, setToAY] = useState(() => bumpAY(fromAY));
  const nextSuggestedClass = useMemo(() => {
    // suggest a class with grade = current grade + 1, same section
    const cur = classes.find((c) => c.id === selectedClassId);
    if (!cur) return "";
    const numGrade = parseInt(cur.grade, 10);
    if (Number.isNaN(numGrade)) return "";
    const target = classes.find((c) => parseInt(c.grade, 10) === numGrade + 1 && c.section === cur.section);
    return target?.id ?? "";
  }, [classes, selectedClassId]);

  const [rows, setRows] = useState(() =>
    students.map((s) => ({
      id: s.id,
      include: true,
      action: "PASS_AND_PROMOTION",
      toClassId: nextSuggestedClass,
    })),
  );

  function syncClass(id: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("classId", id);
    if (fromAY) url.searchParams.set("fromAY", fromAY);
    setClassId(id);
    router.replace(url.pathname + url.search);
  }

  async function submit() {
    setBusy(true); setError(null); setDone(null);
    const payload = {
      fromAY,
      toAY,
      fromClassId: classId,
      students: rows.filter((r) => r.include).map((r) => ({
        studentId: r.id,
        type: r.action,
        toClassId: r.action === "ALUMNI" || r.action === "DROPOUT" ? null
                  : r.action === "DETAIN" ? classId
                  : r.toClassId || null,
      })),
    };
    const r = await fetch("/api/sis/promotion", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!data?.ok) {
      setError(data?.error ?? "Promotion failed.");
      return;
    }
    setDone(`Promoted ${data.count} student${data.count !== 1 ? "s" : ""}.`);
    start(() => router.refresh());
  }

  return (
    <>
      <div className="card card-pad mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="label">From AY</label>
          <input className="input" value={fromAY} readOnly />
          <p className="text-xs text-slate-500 mt-1">School AY: {currentSchoolAY}</p>
        </div>
        <div>
          <label className="label">To AY *</label>
          <input className="input" value={toAY} onChange={(e) => setToAY(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="label">From class</label>
          <select className="input" value={classId} onChange={(e) => syncClass(e.target.value)}>
            <option value="">— Select class —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {classId && (
        <div className="card overflow-x-auto">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="text-sm font-medium">{rows.filter((r) => r.include).length} of {rows.length} selected</div>
            <div className="flex gap-2">
              <button
                onClick={() => setRows((rs) => rs.map((r) => ({ ...r, include: true })))}
                className="text-xs text-brand-700 hover:underline"
              >Select all</button>
              <button
                onClick={() => setRows((rs) => rs.map((r) => ({ ...r, include: false })))}
                className="text-xs text-slate-700 hover:underline"
              >Clear</button>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr><th></th><th>Adm no</th><th>Name</th><th>Roll</th><th>Action</th><th>To class</th></tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr><td colSpan={6} className="text-center text-slate-500 py-8">No students in this class.</td></tr>
              )}
              {students.map((s, idx) => {
                const r = rows[idx];
                if (!r) return null;
                const targetDisabled = r.action === "ALUMNI" || r.action === "DROPOUT" || r.action === "DETAIN";
                return (
                  <tr key={s.id} className={!r.include ? "text-slate-400" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        checked={r.include}
                        onChange={(e) => setRows((rs) => rs.map((x, i) => i === idx ? { ...x, include: e.target.checked } : x))}
                      />
                    </td>
                    <td className="font-mono text-xs">{s.admissionNo}</td>
                    <td>{s.name}</td>
                    <td className="text-xs">{s.rollNo}</td>
                    <td>
                      <select
                        className="input text-xs"
                        value={r.action}
                        onChange={(e) => setRows((rs) => rs.map((x, i) => i === idx ? { ...x, action: e.target.value } : x))}
                      >
                        {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        className="input text-xs"
                        disabled={targetDisabled}
                        value={r.toClassId || ""}
                        onChange={(e) => setRows((rs) => rs.map((x, i) => i === idx ? { ...x, toClassId: e.target.value } : x))}
                      >
                        <option value="">— None —</option>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-3">
            {error && <div className="text-sm text-rose-700">{error}</div>}
            {done && <div className="text-sm text-emerald-700">{done}</div>}
            <div className="ml-auto">
              <button onClick={submit} disabled={busy || pending} className="btn-primary">
                {busy ? "Promoting…" : `Promote ${rows.filter((r) => r.include).length} student${rows.filter((r) => r.include).length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function bumpAY(ay: string): string {
  const m = ay.match(/^(\d{4})-(\d{4})$/);
  if (!m) return ay;
  const a = parseInt(m[1], 10) + 1;
  const b = parseInt(m[2], 10) + 1;
  return `${a}-${b}`;
}
