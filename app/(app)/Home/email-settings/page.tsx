import HomePageTabs from "@/components/HomePageTabs";

export default function EmailSettingsPage() {
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <HomePageTabs />
      <h1 className="h-page text-slate-700 mb-3">Email Settings</h1>
      <div className="card card-pad space-y-3">
        <div>
          <label className="label">SMTP host</label>
          <input className="input" placeholder="smtp.example.com" defaultValue="smtp.gmail.com" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Port</label>
            <input className="input" defaultValue="587" />
          </div>
          <div>
            <label className="label">Encryption</label>
            <select className="input"><option>TLS</option><option>SSL</option><option>None</option></select>
          </div>
        </div>
        <div>
          <label className="label">From address</label>
          <input className="input" placeholder="noreply@school.in" />
        </div>
        <div>
          <label className="label">Username</label>
          <input className="input" />
        </div>
        <div>
          <label className="label">App password</label>
          <input className="input" type="password" />
        </div>
        <div className="flex justify-end">
          <button className="btn-primary" disabled title="Demo only">Save</button>
        </div>
      </div>
    </div>
  );
}
