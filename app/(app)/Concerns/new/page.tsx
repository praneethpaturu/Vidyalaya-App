import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function raise(form: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  const sId = (session.user as any).schoolId;
  const anonymous = form.get("anonymous") === "on";
  const slaDays = parseInt(String(form.get("slaDays") ?? "7"));
  await prisma.concern.create({
    data: {
      schoolId: sId,
      raisedById: anonymous ? null : (session.user as any).id,
      raisedByName: anonymous ? "Anonymous" : (session.user as any).name,
      anonymous,
      category: String(form.get("category")),
      severity: String(form.get("severity") ?? "MEDIUM"),
      subject: String(form.get("subject")),
      body: String(form.get("body")),
      slaDueAt: new Date(Date.now() + slaDays * 86400000),
    },
  });
  redirect("/Concerns");
}

export default function NewConcernPage() {
  return (
    <div className="p-5 max-w-2xl mx-auto">
      <h1 className="h-page mb-3">Raise a Concern</h1>
      <form action={raise} className="card card-pad space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Category *</label>
            <select required className="input" name="category">
              <option>ACADEMIC</option>
              <option>DISCIPLINE</option>
              <option>HEALTH</option>
              <option>IT</option>
              <option>INFRA</option>
              <option>TRANSPORT</option>
              <option>HOSTEL</option>
              <option>OTHER</option>
            </select>
          </div>
          <div>
            <label className="label">Severity</label>
            <select className="input" name="severity">
              <option>LOW</option><option selected>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
            </select>
          </div>
        </div>
        <div><label className="label">Subject *</label><input required className="input" name="subject" /></div>
        <div><label className="label">Description *</label><textarea required className="input" name="body" rows={5} /></div>
        <div className="grid grid-cols-2 gap-3 items-end">
          <div><label className="label">SLA (days)</label><input type="number" className="input" name="slaDays" defaultValue={7} /></div>
          <label className="text-sm flex items-center gap-1.5"><input type="checkbox" name="anonymous" /> Submit anonymously</label>
        </div>
        <div className="flex justify-end gap-2">
          <a href="/Concerns" className="btn-outline">Cancel</a>
          <button className="btn-primary">Raise</button>
        </div>
      </form>
    </div>
  );
}
