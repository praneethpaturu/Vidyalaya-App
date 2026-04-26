import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function checkIn(form: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  const sId = (session.user as any).schoolId;
  const phone = String(form.get("phone") ?? "");
  // Banned-list block
  if (phone) {
    const ban = await prisma.visitorBan.findFirst({ where: { schoolId: sId, phone, active: true } });
    if (ban) {
      redirect(`/Home/Visitor_Mgmt?error=banned&reason=${encodeURIComponent(ban.reason)}`);
    }
  }
  const badgeNo = "V" + String(Date.now()).slice(-7);
  await prisma.visitor.create({
    data: {
      schoolId: sId,
      name: String(form.get("name")),
      phone: phone || null,
      purpose: String(form.get("purpose")),
      hostName: String(form.get("hostName") ?? "") || null,
      vehicleNo: String(form.get("vehicleNo") ?? "") || null,
      idProofType: String(form.get("idProofType") ?? "") || null,
      idProofNo: String(form.get("idProofNo") ?? "") || null,
      badgeNo,
      notes: String(form.get("notes") ?? "") || null,
    },
  });
  redirect(`/Home/Visitor_Mgmt/badge?badge=${badgeNo}`);
}

async function checkOut(form: FormData) {
  "use server";
  const id = String(form.get("id"));
  await prisma.visitor.update({
    where: { id },
    data: { status: "OUT", outAt: new Date() },
  });
  revalidatePath("/Home/Visitor_Mgmt");
}

export default async function VisitorEntryPage({ searchParams }: { searchParams: Promise<{ error?: string; reason?: string }> }) {
  const sp = await searchParams;
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const [insideNow, purposes] = await Promise.all([
    prisma.visitor.findMany({ where: { schoolId: sId, status: "IN" }, orderBy: { inAt: "desc" }, take: 20 }),
    prisma.visitPurpose.findMany({ where: { schoolId: sId, active: true } }),
  ]);
  return (
    <div className="p-5 max-w-5xl mx-auto">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="h-page">Visitor Entry</h1>
          <p className="muted">Capture identity, purpose and host. Banned-list and OTP-to-host are checked.</p>
        </div>
        <Link href="/Home/Visitor_Mgmt/log" className="btn-outline">View Log</Link>
      </div>

      {sp.error === "banned" && (
        <div className="mb-3 px-4 py-2 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200">
          ⚠ This visitor is on the banned list. Reason: {sp.reason ?? "—"}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form action={checkIn} className="card card-pad lg:col-span-2 space-y-3">
          <h2 className="h-section mb-1">New visitor</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Name *</label><input required className="input" name="name" /></div>
            <div><label className="label">Phone</label><input className="input" name="phone" placeholder="+91…" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Purpose *</label>
              <select required className="input" name="purpose" defaultValue="">
                <option value="" disabled>— Select —</option>
                {purposes.length === 0 && (
                  <>
                    <option>Meeting Principal</option>
                    <option>Parent Visit</option>
                    <option>Vendor Delivery</option>
                    <option>Maintenance</option>
                    <option>Interview</option>
                    <option>Tour / Admission Enquiry</option>
                  </>
                )}
                {purposes.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div><label className="label">Host (staff name)</label><input className="input" name="hostName" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Vehicle no</label><input className="input" name="vehicleNo" placeholder="KA-01-AB-1234" /></div>
            <div>
              <label className="label">ID proof</label>
              <div className="flex gap-2">
                <select className="input w-1/3" name="idProofType">
                  <option value="">—</option>
                  <option value="AADHAAR">Aadhaar</option>
                  <option value="PAN">PAN</option>
                  <option value="DL">DL</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="VOTER">Voter ID</option>
                </select>
                <input className="input flex-1" name="idProofNo" placeholder="ID number" />
              </div>
            </div>
          </div>
          <div><label className="label">Notes</label><textarea className="input" name="notes" rows={2} /></div>
          <div className="text-xs text-slate-500 italic">Photo capture (webcam) and OTP-to-host are part of production gate-app — placeholders here.</div>
          <button className="btn-primary w-full">Check In & Print Badge</button>
        </form>

        <div className="card">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="text-sm font-medium">Inside the campus</div>
            <span className="text-[11px] text-slate-500">{insideNow.length} visitors</span>
          </div>
          <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {insideNow.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">No visitors inside.</li>}
            {insideNow.map((v) => (
              <li key={v.id} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{v.name}</div>
                    <div className="text-xs text-slate-500">{v.purpose} · {v.hostName ?? "—"}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{v.badgeNo} · in {new Date(v.inAt).toLocaleTimeString("en-IN")}</div>
                  </div>
                  <form action={checkOut}>
                    <input type="hidden" name="id" value={v.id} />
                    <button className="btn-outline text-xs px-2 py-1">Check Out</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
