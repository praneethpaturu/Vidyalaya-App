const REQUIRED = [
  { grade: "EY / Pre-Primary", docs: ["Birth Certificate", "Aadhaar (child)", "Aadhaar (parent)", "Address Proof", "4 Passport Photos", "Vaccination Card"] },
  { grade: "Grade I-V", docs: ["Birth Certificate", "Aadhaar (child)", "Prior school Mark Sheet", "Transfer Certificate", "4 Passport Photos", "Address Proof"] },
  { grade: "Grade VI-X", docs: ["Aadhaar (child)", "Prior school Mark Sheet", "Transfer Certificate", "Conduct Certificate", "4 Passport Photos", "Address Proof", "Migration Cert (if board change)"] },
];

const FIELDS = [
  { name: "Child name", req: true },
  { name: "Date of Birth", req: true },
  { name: "Gender", req: true },
  { name: "Blood group", req: false },
  { name: "Mother tongue", req: false },
  { name: "Religion", req: false },
  { name: "Caste/Category", req: false },
  { name: "Father's name", req: true },
  { name: "Father's occupation", req: false },
  { name: "Mother's name", req: true },
  { name: "Mother's occupation", req: false },
  { name: "Family income (annual)", req: false },
  { name: "Address", req: true },
  { name: "Pin code", req: true },
  { name: "Emergency contact", req: true },
  { name: "Medical conditions", req: false },
  { name: "Allergies", req: false },
];

export default function AdmissionDocsPage() {
  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-3">Documents and Fields</h1>
      <p className="muted mb-4">Configure required documents per grade and custom application fields.</p>

      <h2 className="h-section mb-2">Documents by grade</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {REQUIRED.map((r) => (
          <div key={r.grade} className="card card-pad">
            <div className="text-sm font-medium mb-2">{r.grade}</div>
            <ul className="text-xs text-slate-700 space-y-1">
              {r.docs.map((d) => <li key={d}>• {d}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <h2 className="h-section mb-2">Application fields</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Field</th><th>Required?</th><th>Type</th></tr></thead>
          <tbody>
            {FIELDS.map((f) => (
              <tr key={f.name}>
                <td>{f.name}</td>
                <td>{f.req ? <span className="badge-amber">Yes</span> : <span className="badge-slate">No</span>}</td>
                <td className="text-xs text-slate-500">text</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
