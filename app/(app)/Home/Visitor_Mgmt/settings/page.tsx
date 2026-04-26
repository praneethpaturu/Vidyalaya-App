export default function VisitorSettingsPage() {
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-3">Visitor Mgmt Settings</h1>
      <div className="card card-pad space-y-3">
        <Toggle label="Capture photo (webcam)" defaultOn />
        <Toggle label="Send OTP to host before allowing entry" />
        <Toggle label="Print badge automatically on Check-In" defaultOn />
        <Toggle label="Block banned visitors by phone" defaultOn />
        <Toggle label="Capture vehicle number" defaultOn />
        <Toggle label="Mandatory ID proof (Aadhaar / DL / etc.)" defaultOn />
        <hr />
        <div>
          <label className="label">Closing time auto check-out</label>
          <select className="input"><option>21:00</option><option>22:00</option><option>None</option></select>
        </div>
        <div>
          <label className="label">Badge expiry</label>
          <select className="input"><option>Same day</option><option>4 hours</option><option>2 hours</option></select>
        </div>
        <div className="flex justify-end">
          <button className="btn-primary" disabled>Save</button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  return (
    <label className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <input type="checkbox" defaultChecked={defaultOn} className="h-4 w-7 rounded-full" />
    </label>
  );
}
