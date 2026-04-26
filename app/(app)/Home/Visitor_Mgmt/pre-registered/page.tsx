import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function preRegister(form: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  const sId = (session.user as any).schoolId;
  const qrCode = "MCB-" + Math.random().toString(36).slice(2, 10).toUpperCase();
  await prisma.preRegisteredVisitor.create({
    data: {
      schoolId: sId,
      name: String(form.get("name")),
      phone: String(form.get("phone")),
      purpose: String(form.get("purpose")),
      hostUserId: (session.user as any).id,
      hostName: (session.user as any).name,
      expectedAt: new Date(String(form.get("expectedAt"))),
      qrCode,
    },
  });
  revalidatePath("/Home/Visitor_Mgmt/pre-registered");
}

export default async function PreRegPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const items = await prisma.preRegisteredVisitor.findMany({
    where: { schoolId: sId },
    orderBy: { expectedAt: "desc" },
    take: 50,
  });
  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-3">Pre-Registered Visitors</h1>
      <p className="muted mb-4">Staff or parents invite visitors with date, purpose. QR is emailed/SMSed; QR scan at gate auto-approves entry.</p>

      <form action={preRegister} className="card card-pad mb-5 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div><label className="label">Visitor name *</label><input required className="input" name="name" /></div>
        <div><label className="label">Phone *</label><input required className="input" name="phone" /></div>
        <div><label className="label">Purpose *</label><input required className="input" name="purpose" /></div>
        <div><label className="label">Expected at *</label><input required type="datetime-local" className="input" name="expectedAt" /></div>
        <button className="btn-primary">Generate QR</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>QR</th><th>Visitor</th><th>Phone</th><th>Purpose</th><th>Host</th><th>Expected</th><th>Used?</th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-8">No Data Found</td></tr>}
            {items.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs">{p.qrCode}</td>
                <td className="font-medium">{p.name}</td>
                <td className="font-mono text-xs">{p.phone}</td>
                <td>{p.purpose}</td>
                <td className="text-xs">{p.hostName}</td>
                <td className="text-xs">{new Date(p.expectedAt).toLocaleString("en-IN")}</td>
                <td>{p.used ? <span className="badge-green">Used</span> : <span className="badge-amber">Pending</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
