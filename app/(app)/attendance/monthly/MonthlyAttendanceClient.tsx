"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type Cls = { id: string; name: string };
type Stu = { id: string; admissionNo: string; rollNo: string; name: string };
type Existing = Record<string, { workingDays: number; presentDays: number; lateDays: number; earlyLeaveDays: number; remarks: string | null }>;

export default function MonthlyAttendanceClient({
  classes, selectedClassId, year, month, students, existing,
}: { classes: Cls[]; selectedClassId: string; year: number; month: number; students: Stu[]; existing: Existing }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  // pre-populate working days from defaultWorkingDays
  const defaultWorking = workingDaysIn(year, month);
  const [working, setWorking] = useState<number>(() => {
    const any = Object.values(existing)[0];
    return any?.workingDays ?? defaultWorking;
  });

  const [rows, setRows] = useState(() =>
    students.map((s) => ({
      id: s.id,
      workingDays: existing[s.id]?.workingDays ?? defaultWorking,
      presentDays: existing[s.id]?.presentDays ?? defaultWorking,
      lateDays: existing[s.id]?.lateDays ?? 0,
      earlyLeaveDays: existing[s.id]?.earlyLeaveDays ?? 0,
      remarks: existing[s.id]?.remarks ?? "",
    })),
  );

  // re-seed if class/month changes (server re-renders → the Component receives new students/existing)
  useEffect(() => {
    setRows(students.map((s) => ({
      id: s.id,
      workingDays: existing[s.id]?.workingDays ?? defaultWorking,
      presentDays: existing[s.id]?.presentDays ?? defaultWorking,
      lateDays: existing[s.id]?.lateDays ?? 0,
      earlyLeaveDays: existing[s.id]?.earlyLeaveDays ?? 0,
      remarks: existing[s.id]?.remarks ?? "",
    })));
    setWorking(Object.values(existing)[0]?.workingDays ?? defaultWorking);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, year, month]);

  function setParam(k: string, v: string) {
    const sp = new URLSearchParams(window.location.search);
    if (v) sp.set(k, v); else sp.delete(k);
    router.replace(`${window.location.pathname}?${sp.toString()}`);
  }

  function applyWorkingToAll() {
    setRows((rs) => rs.map((r) => ({ ...r, workingDays: working, presentDays: Math.min(r.presentDays, working) })));
  }

  async function save() {
    setBusy(true); setError(null); setDone(null);
    const r = await fetch("/api/attendance/monthly", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        classId: selectedClassId,
        year, month,
        rows: rows.map((r) => ({
          studentId: r.id,
          workingDays: Number(r.workingDays),
          presentDays: Number(r.presentDays),
          lateDays: Number(r.lateDays),
          earlyLeaveDays: Number(r.earlyLeaveDays),
          remarks: r.remarks || null,
        })),
      }),
    });
    const data = await r.json().catch(() => ({}));
    setBusy(false);
    if (!data?.ok) {
      setError(data?.error ?? "Save failed.");
      return;
    }
    setDone(`Saved ${data.count} row${data.count !== 1 ? "s" : ""}.`);
    start(() => router.refresh());
  }

  return (
    <>
      <div className="card card-pad mb-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="label">Class</label>
          <select className="input" value={selectedClassId} onChange={(e) => setParam("classId", e.target.value)}>
            <option value="">— Select —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Year</label>
          <input type="number" className="input" value={year} onChange={(e) => setParam("year", e.target.value)} />
        </div>
        <div>
          <label className="label">Month</label>
          <select className="input" value={month} onChange={(e) => setParam("month", e.target.value)}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <input type="number" className="input" value={working} onChange={(e) => setWorking(Number(e.target.value))} />
          <button className="btn-outline whitespace-nowrap" onClick={applyWorkingToAll}>Apply working days</button>
        </div>
      </div>

      {selectedClassId && (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Roll</th><th>Adm no</th><th>Name</th>
                <th>Working</th><th>Present</th><th>Late</th><th>Early leave</th><th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && <tr><td colSpan={8} className="text-center text-slate-500 py-8">No students.</td></tr>}
              {students.map((s, idx) => {
                const r = rows[idx];
                if (!r) return null;
                return (
                  <tr key={s.id}>
                    <td className="text-xs">{s.rollNo}</td>
                    <td className="font-mono text-xs">{s.admissionNo}</td>
                    <td>{s.name}</td>
                    <td><Num value={r.workingDays} onChange={(v) => upd(idx, { workingDays: v })} /></td>
                    <td><Num value={r.presentDays} onChange={(v) => upd(idx, { presentDays: v })} /></td>
                    <td><Num value={r.lateDays} onChange={(v) => upd(idx, { lateDays: v })} /></td>
                    <td><Num value={r.earlyLeaveDays} onChange={(v) => upd(idx, { earlyLeaveDays: v })} /></td>
                    <td>
                      <input
                        className="input text-xs"
                        value={r.remarks}
                        onChange={(e) => upd(idx, { remarks: e.target.value })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-3">
            {error && <div className="text-sm text-rose-700">{error}</div>}
            {done && <div className="text-sm text-emerald-700">{done}</div>}
            <button onClick={save} disabled={busy || pending} className="btn-primary ml-auto">
              {busy ? "Saving…" : "Save attendance"}
            </button>
          </div>
        </div>
      )}
    </>
  );

  function upd(i: number, patch: Partial<typeof rows[number]>) {
    setRows((rs) => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  }
}

function Num({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      max={31}
      className="input text-xs w-20"
      value={value}
      onChange={(e) => onChange(Number(e.target.value || 0))}
    />
  );
}

function workingDaysIn(year: number, month: number): number {
  // Default = weekdays in the month (Mon-Sat). User overrides with the field.
  const days = new Date(year, month, 0).getDate();
  let n = 0;
  for (let d = 1; d <= days; d++) {
    const wd = new Date(year, month - 1, d).getDay(); // 0=Sun
    if (wd !== 0) n++;
  }
  return n;
}
