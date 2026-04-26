const CATEGORIES = [
  { name: "Parent / Guardian", desc: "Visiting their child / class teacher", color: "blue" },
  { name: "Vendor / Supplier", desc: "Deliveries, services, contractors", color: "amber" },
  { name: "Government / Inspector", desc: "Statutory visit", color: "violet" },
  { name: "Media / Press", desc: "Coverage, interviews", color: "rose" },
  { name: "Alumni", desc: "Returning student", color: "emerald" },
  { name: "Interview Candidate", desc: "Recruitment", color: "sky" },
  { name: "Maintenance / AMC", desc: "Equipment service", color: "slate" },
  { name: "Tour / Admission", desc: "Campus tour seekers", color: "amber" },
];

export default function CategoriesPage() {
  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="h-page mb-3">Visitor Categories</h1>
      <p className="muted mb-4">Standard visitor categories with badge colour coding.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CATEGORIES.map((c) => (
          <div key={c.name} className="card card-pad">
            <div className={`text-[10px] uppercase tracking-wide font-semibold text-${c.color}-700`}>{c.color}</div>
            <div className="text-base font-medium">{c.name}</div>
            <div className="text-xs text-slate-500 mt-1">{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
