const REPORTS = [
  "Books wise Issue Report",
  "Student wise Issued/Return Report",
  "Library Book Details",
  "Library Usage Log Report",
  "Library Books Issue/Return Report",
  "Library Dashboard",
  "Students Library Fine Report",
  "Library Book Index",
  "Staff Professional Development Log Report",
];

export default function LibraryReportsPage() {
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-3">Library Reports</h1>
      <ul className="card divide-y divide-slate-100">
        {REPORTS.map((r) => (
          <li key={r} className="px-4 py-3 flex items-center justify-between">
            <div className="text-sm">{r}</div>
            <div className="space-x-2">
              <button className="btn-tonal text-xs px-3 py-1">View</button>
              <button className="btn-outline text-xs px-3 py-1">Export</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
