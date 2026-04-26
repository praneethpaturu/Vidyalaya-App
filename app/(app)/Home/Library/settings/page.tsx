import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function LibrarySettingsPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const [cats, pubs, returnDays, maxBooks, fineRules] = await Promise.all([
    prisma.libraryCategory.findMany({ where: { schoolId: sId } }),
    prisma.libraryPublisher.findMany({ where: { schoolId: sId } }),
    prisma.libraryReturnDays.findMany({ where: { schoolId: sId } }),
    prisma.libraryMaximumBooks.findMany({ where: { schoolId: sId } }),
    prisma.libraryFineRule.findMany({ where: { schoolId: sId } }),
  ]);
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-4">Library Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <Card title="Categories" empty="None">
          <ul className="divide-y divide-slate-100">
            {cats.map((c) => <li key={c.id} className="px-4 py-2 flex justify-between text-sm"><span>{c.name}</span><span className={c.active ? "badge-green" : "badge-slate"}>{c.active ? "Active" : "Inactive"}</span></li>)}
          </ul>
        </Card>
        <Card title="Publishers" empty="None">
          <ul className="divide-y divide-slate-100">
            {pubs.map((p) => <li key={p.id} className="px-4 py-2 text-sm flex justify-between"><span className="font-medium">{p.name}</span><span className="text-xs text-slate-500">{p.email ?? "—"}</span></li>)}
          </ul>
        </Card>

        <Card title="Return Days (Member × Category)" empty="None">
          <table className="table"><thead><tr><th>Member</th><th>Category</th><th>Days</th><th>Grace</th><th>Excl. Wknd</th></tr></thead>
          <tbody>
            {returnDays.map((r) => (
              <tr key={r.id}>
                <td>{r.memberType}</td>
                <td>{r.category}</td>
                <td>{r.days}</td>
                <td>{r.graceDays}</td>
                <td>{r.excludeWeekends ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody></table>
        </Card>
        <Card title="Maximum Books" empty="None">
          <table className="table"><thead><tr><th>Member</th><th>Category</th><th>Class</th><th>Max</th></tr></thead>
          <tbody>
            {maxBooks.map((m) => (
              <tr key={m.id}><td>{m.memberType}</td><td>{m.category}</td><td>{m.classId ?? "Any"}</td><td>{m.maxBooks}</td></tr>
            ))}
          </tbody></table>
        </Card>

        <Card title="Fine Amounts" empty="None">
          <table className="table"><thead><tr><th>Category</th><th>Days</th><th>Per-day</th><th>Flat</th><th>Cap</th><th>Waiver</th></tr></thead>
          <tbody>
            {fineRules.map((f) => (
              <tr key={f.id}>
                <td>{f.category}</td>
                <td>{f.daysFrom}–{f.daysTo === -1 ? "∞" : f.daysTo}</td>
                <td>₹{(f.amountPerDay / 100).toFixed(2)}</td>
                <td>{f.flatAmount > 0 ? `₹${(f.flatAmount / 100).toFixed(2)}` : "—"}</td>
                <td>{f.capAmount > 0 ? `₹${(f.capAmount / 100).toFixed(2)}` : "—"}</td>
                <td>{f.waiverAllowed ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody></table>
        </Card>
        <Card title="Other settings" empty="">
          <ul className="divide-y divide-slate-100 text-sm">
            <li className="px-4 py-2 flex justify-between"><span>Generate Library Book Barcodes</span><Link href="#" className="text-brand-700">Bulk</Link></li>
            <li className="px-4 py-2 flex justify-between"><span>Library Languages</span><Link href="#" className="text-brand-700">Manage</Link></li>
            <li className="px-4 py-2 flex justify-between"><span>Library Vendors (with GST)</span><Link href="#" className="text-brand-700">Manage</Link></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children, empty }: { title: string; children: React.ReactNode; empty: string }) {
  return (
    <div className="card overflow-x-auto">
      <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium">{title}</div>
      {children}
    </div>
  );
}
