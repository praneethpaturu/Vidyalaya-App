import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDate, inr } from "@/lib/utils";
import { recordTdsChallan } from "@/app/actions/tax";
import { Plus } from "lucide-react";

export default async function ChallansPage() {
  const session = await auth();
  const u = session!.user as any;
  const challans = await prisma.tdsChallan.findMany({
    where: { schoolId: u.schoolId },
    orderBy: { challanDate: "desc" },
    take: 100,
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="h-section mb-3">TDS challans deposited</h2>
          <div className="card">
            <table className="table">
              <thead><tr><th>Date</th><th>Type</th><th>BSR / Challan</th><th>Section</th><th>Period</th><th className="text-right">Amount</th></tr></thead>
              <tbody>
                {challans.map((c) => (
                  <tr key={c.id}>
                    <td>{fmtDate(c.challanDate)}</td>
                    <td><span className="badge-blue">{c.type.replace("TDS_","")}</span></td>
                    <td className="font-mono text-xs">{c.bsrCode}/{c.challanNo}</td>
                    <td>{c.section ? <span className="badge-slate">s{c.section}</span> : "—"}</td>
                    <td className="text-slate-600">{c.quarter ? `Q${c.quarter} FY${c.year}-${String((c.year+1)%100).padStart(2,"0")}` : c.year}</td>
                    <td className="text-right font-medium">{inr(c.amount)}</td>
                  </tr>
                ))}
                {challans.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-slate-500">No challans recorded yet — use the form to add one.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="h-section mb-3 flex items-center gap-2"><Plus className="w-4 h-4" /> Record challan</h2>
          <form action={recordTdsChallan} className="card card-pad space-y-3">
            <div>
              <label className="label">Type</label>
              <select className="input" name="type" required>
                <option value="TDS_SALARY">TDS — Salary (s.192)</option>
                <option value="TDS_NON_SALARY">TDS — Non-salary (s.194 series)</option>
                <option value="EPF">EPF deposit</option>
                <option value="ESIC">ESIC deposit</option>
                <option value="PT">Professional Tax</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">BSR code (7-digit)</label><input className="input" name="bsrCode" maxLength={7} required /></div>
              <div><label className="label">Challan #</label><input className="input" name="challanNo" required /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">Date</label><input className="input" name="challanDate" type="date" defaultValue={new Date().toISOString().slice(0,10)} required /></div>
              <div><label className="label">Amount (₹)</label><input className="input" name="amount" type="number" min={0} step="0.01" required /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Section</label>
                <select className="input" name="section">
                  <option value="">—</option>
                  <option value="192">192 (salary)</option>
                  <option value="194C">194C (contractor)</option>
                  <option value="194J">194J (professional)</option>
                  <option value="194I">194I (rent)</option>
                  <option value="194H">194H (commission)</option>
                  <option value="194A">194A (interest)</option>
                </select>
              </div>
              <div>
                <label className="label">Quarter (TDS)</label>
                <select className="input" name="quarter">
                  <option value="">—</option><option value="1">Q1</option><option value="2">Q2</option><option value="3">Q3</option><option value="4">Q4</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">Year</label><input className="input" name="year" type="number" defaultValue={new Date().getFullYear()} required /></div>
              <div><label className="label">Bank</label><input className="input" name="bankName" placeholder="HDFC Bank" /></div>
            </div>
            <button className="btn-primary w-full">Record challan</button>
          </form>
        </div>
      </div>
    </div>
  );
}
