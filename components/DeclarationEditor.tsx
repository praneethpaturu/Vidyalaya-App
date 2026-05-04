import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { calculateTax, recommendRegime, type Regime } from "@/lib/tax";
import { inr } from "@/lib/utils";
import { updateTaxDeclaration } from "@/app/actions/payroll";
import { Calculator, Sparkles } from "lucide-react";

const FY = (() => { const d = new Date(); const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; return `${y}-${String((y + 1) % 100).padStart(2, "0")}`; })();

export default async function DeclarationEditor({ staffId }: { staffId: string }) {
  const session = await auth();
  const u = session!.user as any;
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: { user: true, salaryStructures: { take: 1, orderBy: { effectiveFrom: "desc" } } },
  });
  if (!staff) return null;
  const struct = staff.salaryStructures[0];
  const decl = await prisma.taxDeclaration.findUnique({ where: { staffId_financialYear: { staffId, financialYear: FY } } });

  const baseInput = struct ? {
    basicAnnual: struct.basic * 12,
    hraAnnual: struct.hra * 12,
    daAnnual: struct.da * 12,
    specialAnnual: struct.special * 12,
    transportAnnual: struct.transport * 12,
    bonusAnnual: decl?.bonusAnnual ?? 0,
    perquisitesAnnual: decl?.perquisitesAnnual ?? 0,
    ageBand: ((decl as any)?.ageBand ?? "NORMAL") as any,
    s80C: decl?.s80C ?? 0,
    s80D: decl?.s80D ?? 0,
    s80CCD1B: decl?.s80CCD1B ?? 0,
    s80CCD2: decl?.s80CCD2 ?? 0,
    s80E: decl?.s80E ?? 0,
    s80TTA: decl?.s80TTA ?? 0,
    hraRentPaid: decl?.hraRentPaid ?? 0,
    hraMetro: decl?.hraMetro ?? true,
    homeLoanInterest: decl?.homeLoanInterest ?? 0,
    otherIncome: decl?.otherIncome ?? 0,
  } : null;

  const rec = baseInput ? recommendRegime(baseInput) : null;
  const result = baseInput ? calculateTax({ ...baseInput, regime: (decl?.regime as Regime) ?? "NEW" }) : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Tax declaration · {staff.user.name}</h1>
      <p className="muted mb-6">FY {FY} · {staff.designation} · {staff.employeeId}</p>

      {rec && (
        <div className="card card-pad mb-4 bg-gradient-to-br from-brand-50 to-brand-100/30 border-brand-200">
          <div className="flex items-center gap-2 text-sm font-medium text-brand-800"><Sparkles className="w-4 h-4" /> Regime recommendation</div>
          <div className="mt-2 text-sm text-slate-700">
            New regime tax: <strong>{inr(rec.newTax)}</strong> · Old regime tax: <strong>{inr(rec.oldTax)}</strong>
          </div>
          <div className="mt-1 text-sm">
            <span className="badge-blue">{rec.recommended}</span> saves <strong>{inr(rec.saving)}</strong> per year.
          </div>
        </div>
      )}

      <form action={updateTaxDeclaration.bind(null, staffId)} className="card card-pad space-y-4">
        <div>
          <label className="label">Regime</label>
          <div className="flex flex-col sm:flex-row gap-2">
            {(["NEW","OLD"] as const).map((r) => (
              <label key={r} className={`px-4 py-2 rounded-full border cursor-pointer text-sm ${ (decl?.regime ?? "NEW") === r ? "bg-brand-50 border-brand-300 text-brand-800 font-medium" : "border-slate-200 hover:bg-slate-50"}`}>
                <input type="radio" name="regime" value={r} defaultChecked={(decl?.regime ?? "NEW") === r} className="mr-2" />
                {r === "NEW" ? "New regime (Budget 2025 slabs)" : "Old regime (allows 80C / HRA)"}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Age band</label>
          <div className="flex flex-wrap gap-2">
            {(["NORMAL", "SENIOR", "SUPER_SENIOR"] as const).map((a) => (
              <label key={a} className={`px-3 py-1.5 rounded-full border cursor-pointer text-xs ${((decl as any)?.ageBand ?? "NORMAL") === a ? "bg-brand-50 border-brand-300 text-brand-800 font-medium" : "border-slate-200 hover:bg-slate-50"}`}>
                <input type="radio" name="ageBand" value={a} defaultChecked={((decl as any)?.ageBand ?? "NORMAL") === a} className="mr-1.5" />
                {a === "NORMAL" ? "Below 60" : a === "SENIOR" ? "Senior (60+)" : "Super-senior (80+)"}
              </label>
            ))}
          </div>
          <div className="text-xs text-slate-500 mt-1">Affects old-regime slabs and 80D / 80TTB caps.</div>
        </div>

        <h3 className="h-section text-sm pt-2">Chapter VI-A — old regime</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field name="s80C" label="80C — PF, ELSS, LIC etc. (₹)" defaultValue={(decl?.s80C ?? 0) / 100} hint="Capped ₹1.5L" />
          <Field name="s80D" label="80D — Medical insurance (₹)" defaultValue={(decl?.s80D ?? 0) / 100} hint="Capped ₹25k self / ₹50k senior" />
          <Field name="s80CCD1B" label="80CCD(1B) — NPS extra (₹)" defaultValue={(decl?.s80CCD1B ?? 0) / 100} hint="Capped ₹50k" />
          <Field name="s80E" label="80E — Education loan interest (₹)" defaultValue={(decl?.s80E ?? 0) / 100} hint="Uncapped" />
          <Field name="s80TTA" label="80TTA / 80TTB — Savings interest (₹)" defaultValue={(decl?.s80TTA ?? 0) / 100} hint="Capped ₹10k (₹50k for senior under 80TTB)" />
          <Field name="homeLoanInterest" label="Home loan interest (s.24b) (₹)" defaultValue={(decl?.homeLoanInterest ?? 0) / 100} hint="Capped ₹2L" />
          <Field name="hraRentPaid" label="Annual rent paid (₹)" defaultValue={(decl?.hraRentPaid ?? 0) / 100} hint="For HRA exemption" />
        </div>

        <h3 className="h-section text-sm pt-2">Allowed in BOTH regimes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field name="s80CCD2" label="80CCD(2) — Employer NPS contribution (₹)" defaultValue={(decl?.s80CCD2 ?? 0) / 100} hint="Capped at 10% of basic+DA" />
          <Field name="bonusAnnual" label="Annual bonus / arrears (₹)" defaultValue={(decl?.bonusAnnual ?? 0) / 100} hint="Festival, performance, leave encashment" />
          <Field name="perquisitesAnnual" label="Perquisites s.17(2) (₹)" defaultValue={(decl?.perquisitesAnnual ?? 0) / 100} hint="Accommodation, vehicle, etc." />
          <Field name="otherIncome" label="Other income (₹)" defaultValue={(decl?.otherIncome ?? 0) / 100} hint="Bank interest, freelance, etc." />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="hraMetro" defaultChecked={decl?.hraMetro ?? true} /> Live in metro city (50% HRA exemption basis vs 40%)
        </label>

        <div className="flex gap-2 justify-end">
          <button className="btn-primary"><Calculator className="w-4 h-4" /> Save & recompute</button>
        </div>
      </form>

      {result && (
        <div className="card mt-4">
          <div className="p-4 border-b border-slate-100"><h2 className="h-section">Computed tax — {result.regime}</h2></div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <Row k="Gross salary" v={inr(result.grossSalary)} />
            <Row k="Standard deduction" v={`− ${inr(result.standardDeduction)}`} />
            {result.hraExemption > 0 && <Row k="HRA exemption" v={`− ${inr(result.hraExemption)}`} />}
            {result.chapter6A > 0 && <Row k="Chapter VI-A (80C/D/E/TTA/CCD1B)" v={`− ${inr(result.chapter6A)}`} />}
            {result.s80CCD2 > 0 && <Row k="80CCD(2) — Employer NPS" v={`− ${inr(result.s80CCD2)}`} />}
            {result.homeLoanInterest > 0 && <Row k="Home loan interest" v={`− ${inr(result.homeLoanInterest)}`} />}
            {result.otherIncome > 0 && <Row k="Other income" v={`+ ${inr(result.otherIncome)}`} />}
            <Row k="Taxable income" v={inr(result.taxableIncome)} bold />
          </div>
          <div className="px-4 pb-4">
            <h3 className="text-xs font-semibold uppercase text-slate-500 mb-2">Slab-wise breakdown</h3>
            <table className="table">
              <thead><tr><th>Slab</th><th>Rate</th><th className="text-right">Tax</th></tr></thead>
              <tbody>
                {result.slabwise.map((s, i) => (
                  <tr key={i}>
                    <td>₹{(s.from / 100).toLocaleString("en-IN")} – ₹{(s.to / 100).toLocaleString("en-IN")}</td>
                    <td>{s.rate}%</td>
                    <td className="text-right">{inr(s.amount)}</td>
                  </tr>
                ))}
                <tr><td colSpan={2} className="text-right font-medium">Base tax</td><td className="text-right font-medium">{inr(result.baseTax)}</td></tr>
                {result.rebate87A > 0 && <tr><td colSpan={2} className="text-right text-emerald-700">87A rebate{result.marginalReliefRebate > 0 ? " (marginal relief)" : ""}</td><td className="text-right text-emerald-700">− {inr(result.rebate87A)}</td></tr>}
                {result.surcharge > 0 && <tr><td colSpan={2} className="text-right">Surcharge{result.marginalReliefSurcharge > 0 ? ` (marginal relief: ${inr(result.marginalReliefSurcharge)} waived)` : ""}</td><td className="text-right">{inr(result.surcharge)}</td></tr>}
                <tr><td colSpan={2} className="text-right">Health & Education Cess (4%)</td><td className="text-right">{inr(result.cess)}</td></tr>
                <tr><td colSpan={2} className="text-right font-semibold">Total annual tax</td><td className="text-right font-semibold text-rose-700">{inr(result.totalTax)}</td></tr>
                <tr><td colSpan={2} className="text-right font-semibold">Monthly TDS</td><td className="text-right font-semibold text-rose-700">{inr(result.monthlyTDS)}</td></tr>
              </tbody>
            </table>
          </div>
          {result.notes.length > 0 && (
            <div className="px-4 pb-4">
              <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                {result.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ name, label, defaultValue, hint }: any) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" name={name} type="number" min={0} defaultValue={defaultValue} />
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}
function Row({ k, v, bold }: any) {
  return (
    <div className={`flex items-center justify-between py-1 ${bold ? "border-t border-slate-200 pt-2 mt-1 font-semibold" : ""}`}>
      <span className="text-slate-600">{k}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
}
