import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function ban(form: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  const sId = (session.user as any).schoolId;
  await prisma.visitorBan.create({
    data: {
      schoolId: sId,
      name: String(form.get("name")),
      phone: String(form.get("phone") ?? "") || null,
      reason: String(form.get("reason")),
      bannedById: (session.user as any).id,
    },
  });
  revalidatePath("/Home/Visitor_Mgmt/banned");
}

export default async function BannedPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const list = await prisma.visitorBan.findMany({
    where: { schoolId: sId, active: true },
    orderBy: { bannedAt: "desc" }, take: 50,
  });
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-3">Banned List</h1>
      <p className="muted mb-4">Visitors blocked from entering. Phone-match is enforced at gate.</p>

      <form action={ban} className="card card-pad mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div><label className="label">Name *</label><input required className="input" name="name" /></div>
        <div><label className="label">Phone</label><input className="input" name="phone" /></div>
        <div><label className="label">Reason *</label><input required className="input" name="reason" /></div>
        <button className="btn-danger">Ban</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Name</th><th>Phone</th><th>Reason</th><th>Banned</th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={4} className="text-center text-slate-500 py-8">No bans on file.</td></tr>}
            {list.map((b) => (
              <tr key={b.id}>
                <td className="font-medium">{b.name}</td>
                <td className="font-mono text-xs">{b.phone ?? "—"}</td>
                <td>{b.reason}</td>
                <td className="text-xs">{new Date(b.bannedAt).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
