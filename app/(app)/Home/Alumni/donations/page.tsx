import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/utils";

async function pledgeDonation(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const donorName = String(form.get("donorName") ?? "").trim();
  const amount = Math.round(Number(form.get("amount") ?? 0) * 100);
  if (!donorName || amount <= 0) return;
  await prisma.alumniDonation.create({
    data: {
      schoolId: u.schoolId,
      donorName,
      donorEmail: String(form.get("donorEmail") ?? "") || null,
      donorPhone: String(form.get("donorPhone") ?? "") || null,
      donorPan: String(form.get("donorPan") ?? "").toUpperCase() || null,
      amount,
      purpose: String(form.get("purpose") ?? "") || null,
      pledgedAt: new Date(),
      status: "PLEDGED",
    },
  });
  revalidatePath("/Home/Alumni/donations");
  redirect("/Home/Alumni/donations?pledged=1");
}

async function markReceived(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const id = String(form.get("id"));
  const seq = await prisma.alumniDonation.count({ where: { schoolId: u.schoolId, status: "RECEIVED" } });
  const receiptNo = `DON-${new Date().getFullYear()}-${String(seq + 1).padStart(5, "0")}`;
  await prisma.alumniDonation.updateMany({
    where: { id, schoolId: u.schoolId },
    data: { status: "RECEIVED", receivedAt: new Date(), receiptNo },
  });
  revalidatePath("/Home/Alumni/donations");
}

async function cancel(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const id = String(form.get("id"));
  await prisma.alumniDonation.updateMany({
    where: { id, schoolId: u.schoolId },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/Home/Alumni/donations");
}

export const dynamic = "force-dynamic";

export default async function DonationsPage({
  searchParams,
}: { searchParams: Promise<{ pledged?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT"]);
  const sp = await searchParams;
  const donations = await prisma.alumniDonation.findMany({
    where: { schoolId: u.schoolId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const totalPledged  = donations.filter((d) => d.status === "PLEDGED").reduce((s, d) => s + d.amount, 0);
  const totalReceived = donations.filter((d) => d.status === "RECEIVED").reduce((s, d) => s + d.amount, 0);

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <Link href="/Home/Alumni" className="text-xs text-brand-700 hover:underline">← Alumni</Link>
      <h1 className="h-page mt-1 mb-1">Alumni donations</h1>
      <p className="muted mb-3">Pledge → received. 80G-style receipt PDF on receive.</p>

      {sp.pledged && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Pledge recorded.</div>}

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Total pledged</div><div className="text-xl font-medium text-amber-700">{inr(totalPledged)}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Total received</div><div className="text-xl font-medium text-emerald-700">{inr(totalReceived)}</div></div>
        <div className="card card-pad"><div className="text-[11px] text-slate-500">Donations count</div><div className="text-xl font-medium">{donations.length}</div></div>
      </div>

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ Record pledge</summary>
        <form action={pledgeDonation} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <div className="md:col-span-2"><label className="label">Donor name *</label><input required name="donorName" className="input" /></div>
          <div><label className="label">Amount (₹) *</label><input required type="number" min={1} step={1} name="amount" className="input" /></div>
          <div><label className="label">Email</label><input type="email" name="donorEmail" className="input" /></div>
          <div><label className="label">Phone</label><input name="donorPhone" className="input" /></div>
          <div><label className="label">PAN (for 80G)</label><input name="donorPan" className="input" placeholder="ABCDE1234F" /></div>
          <div className="md:col-span-3"><label className="label">Purpose</label><input name="purpose" className="input" placeholder="Library expansion / scholarship corpus / general" /></div>
          <button type="submit" className="btn-primary md:col-span-3">Save pledge</button>
        </form>
      </details>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Donor</th><th>Purpose</th><th className="text-right">Amount</th><th>Status</th><th>Pledged</th><th>Received</th><th></th></tr>
          </thead>
          <tbody>
            {donations.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">No donations yet.</td></tr>}
            {donations.map((d) => (
              <tr key={d.id}>
                <td>
                  <div className="font-medium">{d.donorName}</div>
                  <div className="text-xs text-slate-500">{d.donorEmail ?? d.donorPhone ?? "—"}</div>
                </td>
                <td className="text-xs max-w-xs">{d.purpose ?? "—"}</td>
                <td className="text-right">{inr(d.amount)}</td>
                <td>
                  <span className={
                    d.status === "RECEIVED" ? "badge-green" :
                    d.status === "CANCELLED" ? "badge-red" : "badge-amber"
                  }>{d.status}</span>
                  {d.receiptNo && <div className="text-[10px] text-slate-500 font-mono mt-0.5">{d.receiptNo}</div>}
                </td>
                <td className="text-xs">{d.pledgedAt ? new Date(d.pledgedAt).toLocaleDateString("en-IN") : "—"}</td>
                <td className="text-xs">{d.receivedAt ? new Date(d.receivedAt).toLocaleDateString("en-IN") : "—"}</td>
                <td className="text-right space-x-2 whitespace-nowrap">
                  {d.status === "PLEDGED" && (
                    <>
                      <form action={markReceived} className="inline">
                        <input type="hidden" name="id" value={d.id} />
                        <button className="text-emerald-700 text-xs hover:underline" type="submit">Mark received</button>
                      </form>
                      <form action={cancel} className="inline">
                        <input type="hidden" name="id" value={d.id} />
                        <button className="text-rose-700 text-xs hover:underline" type="submit">Cancel</button>
                      </form>
                    </>
                  )}
                  {d.status === "RECEIVED" && (
                    <a href={`/api/alumni/donations/${d.id}/receipt`} target="_blank" className="text-brand-700 text-xs hover:underline">Receipt PDF</a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
