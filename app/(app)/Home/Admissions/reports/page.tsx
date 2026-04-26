import Link from "next/link";

const REPORTS = [
  { label: "Enquiry Report", desc: "All enquiries with source, stage, counselor", href: "/Home/Admissions" },
  { label: "Application Report", desc: "Submitted applications by stage", href: "/Home/Admissions?status=APPLICATION_SUBMITTED" },
  { label: "Admission Report", desc: "Confirmed + Enrolled", href: "/Home/Admissions?status=ENROLLED" },
  { label: "Source ROI", desc: "Lead source vs enrolment", href: "/Home/Admissions/pre-admission" },
  { label: "Campaign Wise Analysis", desc: "Per campaign performance", href: "/Home/Admissions/pre-admission" },
  { label: "Counselor Performance", desc: "By counselor / outcome", href: "/Home/Admissions/pre-admission" },
  { label: "Drop-off Analysis", desc: "Funnel stage drop-offs", href: "/Home/Admissions/pre-admission" },
  { label: "Daily / Weekly / Monthly Summary", desc: "Roll-up summaries", href: "/Home/Admissions/mis" },
];

export default function AdmissionReportsPage() {
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page text-slate-700 mb-4">Admission Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {REPORTS.map((r) => (
          <Link key={r.label} href={r.href} className="card card-pad hover:bg-slate-50 transition">
            <div className="text-base font-medium text-mcb-blue">{r.label}</div>
            <div className="text-xs text-slate-500 mt-1">{r.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
