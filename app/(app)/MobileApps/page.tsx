export default function MobileAppsPage() {
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-3">Mobile Apps</h1>
      <p className="muted mb-4">App announcements, banners, push notifications config, version forced-update, login statistics.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card card-pad">
          <div className="text-sm font-medium">Parent App</div>
          <div className="text-xs text-slate-500 mt-1">v3.4.1 · Latest</div>
          <div className="mt-3 text-xs text-slate-600">Force-update threshold: <span className="font-mono">3.2.0</span></div>
        </div>
        <div className="card card-pad">
          <div className="text-sm font-medium">Student App</div>
          <div className="text-xs text-slate-500 mt-1">v2.1.5 · Latest</div>
          <div className="mt-3 text-xs text-slate-600">Force-update threshold: <span className="font-mono">2.0.0</span></div>
        </div>
        <div className="card card-pad">
          <div className="text-sm font-medium">Teacher App</div>
          <div className="text-xs text-slate-500 mt-1">v1.8.0 · Latest</div>
          <div className="mt-3 text-xs text-slate-600">Force-update threshold: <span className="font-mono">1.7.0</span></div>
        </div>
        <div className="card card-pad">
          <div className="text-sm font-medium">Banners & Push</div>
          <div className="text-xs text-slate-500 mt-1">Configure home banners, push notification campaigns and FCM keys.</div>
          <a href="/Connect/SMS" className="btn-tonal text-xs px-3 py-1 mt-2 inline-block">Manage</a>
        </div>
      </div>
    </div>
  );
}
