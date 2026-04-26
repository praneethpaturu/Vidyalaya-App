const TYPES = ["Character", "Study", "Conduct", "Migration", "Provisional", "No Objection"];

export default function GeneralCertsPage() {
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-3">General Certificates</h1>
      <p className="muted mb-4">Templates with merge tokens like {"{{student.name}}"}, {"{{class}}"}, {"{{academicYear}}"}.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TYPES.map((t) => (
          <div key={t} className="card card-pad flex items-center justify-between">
            <div>
              <div className="font-medium">{t} Certificate</div>
              <div className="text-xs text-slate-500">Standard template, single signatory</div>
            </div>
            <button className="btn-tonal text-sm" disabled>Issue</button>
          </div>
        ))}
      </div>
    </div>
  );
}
