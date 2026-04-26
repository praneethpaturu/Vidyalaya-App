import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function add(form: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  const sId = (session.user as any).schoolId;
  await prisma.visitPurpose.create({
    data: {
      schoolId: sId,
      name: String(form.get("name")),
      needsOtp: form.get("needsOtp") === "on",
    },
  });
  revalidatePath("/Home/Visitor_Mgmt/purposes");
}

export default async function PurposesPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const purposes = await prisma.visitPurpose.findMany({ where: { schoolId: sId }, orderBy: { name: "asc" } });
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-3">Visit Purposes</h1>
      <form action={add} className="card card-pad mb-4 flex items-end gap-3">
        <div className="flex-1">
          <label className="label">Purpose name *</label>
          <input required name="name" className="input" placeholder="e.g. Vendor Meeting" />
        </div>
        <label className="text-sm flex items-center gap-1.5"><input type="checkbox" name="needsOtp" /> Needs OTP</label>
        <button className="btn-primary">Add</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Name</th><th>Needs OTP?</th><th>Active</th></tr></thead>
          <tbody>
            {purposes.length === 0 && <tr><td colSpan={3} className="text-center text-slate-500 py-6">No Data Found</td></tr>}
            {purposes.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.needsOtp ? <span className="badge-amber">Yes</span> : <span className="badge-slate">No</span>}</td>
                <td>{p.active ? <span className="badge-green">Active</span> : <span className="badge-slate">Inactive</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
