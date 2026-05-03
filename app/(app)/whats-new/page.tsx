import { requirePageRole } from "@/lib/auth";

const RELEASES = [
  {
    date: "3 May 2026",
    title: "MyClassBoard parity — fully shipped",
    items: [
      "AddOns: CPD ledger, Infirmary visits, PDC register, Recruitment, PMS goals + reviews",
      "Tally ERP export — Receipts / Payments / Vouchers / Ledger masters as Tally Prime XML",
      "OMR sheets with auto-grading + push to exam marks",
      "Fixed assets register + SLM/WDV depreciation",
      "RTE 25% quota tracking",
      "Alumni donations with 80G receipt PDF",
      "Drip campaigns over time (SMS/Email/WhatsApp/Voice)",
      "Parent pickup-request workflow",
      "Holiday master + working-day calendar",
      "Inter-branch student transfer",
      "Exam invigilator + seating plan with PDF",
      "Late-fee accrual cron + admin policy UI",
    ],
  },
  {
    date: "2 May 2026",
    title: "Reports + AI exam authoring",
    items: [
      "10 preset reports compute live data and download as CSV",
      "Custom report builder with live preview",
      "Question Bank with AI generator (OpenAI)",
      "One-click AI exam draft creator",
      "PTM scheduling + per-student feedback",
      "Bank reconciliation with auto-match",
      "HR Payroll generation with attendance-based LOP",
      "Finance Receipt entry → FIFO distribution → receipt PDF",
    ],
  },
  {
    date: "1 May 2026",
    title: "Approvals + admissions funnel",
    items: [
      "Generic approval primitive with handler registry",
      "Admissions: Sources / Stages settings, Applications, Admit flow",
      "Pre-admission exams with hall tickets + marks capture",
      "Student promotion with revert via approval",
      "Concession workflow with approval",
      "Migration Center: 21 entity importers",
      "Multi-AY, Zonal layer, manage-menus matrix",
    ],
  },
];

export default async function WhatsNewPage() {
  await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER", "TEACHER", "PARENT", "STUDENT", "TRANSPORT_MANAGER", "INVENTORY_MANAGER"]);
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-1">What's new</h1>
      <p className="muted mb-5">Latest improvements to Vidyalaya.</p>

      <div className="space-y-5">
        {RELEASES.map((r, i) => (
          <article key={r.date} className="card card-pad">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{r.date}</span>
              {i === 0 && <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700">Latest</span>}
            </div>
            <h2 className="text-lg font-medium tracking-tight">{r.title}</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              {r.items.map((it) => (
                <li key={it} className="flex gap-2">
                  <span className="text-emerald-600">·</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
