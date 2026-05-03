"use client";

import Link from "next/link";

// We render QRs through a public service rather than bundling a QR library.
// `api.qrserver.com` is unauthenticated and CORS-open; the URL is encoded so
// the QR points back to /enquire/<schoolCode> on this host.
function qr(url: string, size = 320) {
  const encoded = encodeURIComponent(url);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&qzone=1&data=${encoded}`;
}

export default function QRPrintClient({
  schoolName, schoolCity, onlineUrl, walkinUrl,
}: { schoolName: string; schoolCity: string; onlineUrl: string; walkinUrl: string }) {
  return (
    <div className="p-5 max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-4 print:hidden">
        <div>
          <h1 className="h-page">Enquiry QR codes</h1>
          <p className="muted">Print and place these at the front office. Each scan opens the public enquiry form pre-filled with the source.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/Home/Admissions" className="btn-outline">← Back</Link>
          <button onClick={() => window.print()} className="btn-primary">Print</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card card-pad text-center">
          <div className="text-xs uppercase tracking-wider text-slate-500">Online form</div>
          <div className="text-lg font-medium mt-1">{schoolName}</div>
          <div className="text-xs text-slate-500">{schoolCity}</div>
          <img
            src={qr(onlineUrl, 320)}
            alt="Online enquiry QR"
            className="mx-auto mt-4 mb-3"
            width={320} height={320}
          />
          <div className="font-mono text-xs text-slate-600 break-all">{onlineUrl}</div>
        </div>

        <div className="card card-pad text-center">
          <div className="text-xs uppercase tracking-wider text-slate-500">Parent walk-in</div>
          <div className="text-lg font-medium mt-1">{schoolName}</div>
          <div className="text-xs text-slate-500">{schoolCity}</div>
          <img
            src={qr(walkinUrl, 320)}
            alt="Walk-in enquiry QR"
            className="mx-auto mt-4 mb-3"
            width={320} height={320}
          />
          <div className="font-mono text-xs text-slate-600 break-all">{walkinUrl}</div>
        </div>
      </div>
    </div>
  );
}
