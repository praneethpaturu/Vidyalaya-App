import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TOKEN_HELP } from "@/lib/merge-tokens";
import AIComposeButtons from "@/components/AIComposeButtons";

async function addTemplate(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const name = String(form.get("name") ?? "").trim();
  const channel = String(form.get("channel") ?? "SMS");
  const body = String(form.get("body") ?? "").trim();
  if (!name || !body) return;
  await prisma.connectTemplate.create({
    data: {
      schoolId: u.schoolId,
      name, channel, body,
      category: String(form.get("category") ?? "TRANSACTIONAL"),
      approved: form.get("approved") === "on",
    },
  }).catch(() => {});
  revalidatePath("/Connect/Templates");
  redirect("/Connect/Templates?added=1");
}

async function updateTemplate(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const id = String(form.get("id"));
  const t = await prisma.connectTemplate.findFirst({ where: { id, schoolId: u.schoolId } });
  if (!t) return;
  await prisma.connectTemplate.update({
    where: { id },
    data: {
      name: String(form.get("name") ?? t.name),
      channel: String(form.get("channel") ?? t.channel),
      body: String(form.get("body") ?? t.body),
      category: String(form.get("category") ?? t.category),
      approved: form.get("approved") === "on",
      active: form.get("active") === "on",
    },
  });
  revalidatePath("/Connect/Templates");
}

async function deleteTemplate(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  await prisma.connectTemplate.deleteMany({ where: { id, schoolId: u.schoolId } });
  revalidatePath("/Connect/Templates");
}

export const dynamic = "force-dynamic";

export default async function TemplatesPage({
  searchParams,
}: { searchParams: Promise<{ added?: string; channel?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "HR_MANAGER", "ACCOUNTANT"]);
  const sp = await searchParams;
  const channel = sp.channel ?? "";
  const templates = await prisma.connectTemplate.findMany({
    where: { schoolId: u.schoolId, ...(channel ? { channel } : {}) },
    orderBy: [{ channel: "asc" }, { name: "asc" }],
  });

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Communication templates</h1>
      <p className="muted mb-3">
        Reusable bodies for SMS / WhatsApp / Email / Voice campaigns. Use
        <span className="font-mono"> {`{{tokens}}`} </span> for personalisation —
        they're expanded per-recipient when the message is sent.
      </p>

      {sp.added && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Template saved.</div>}

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">Available merge tokens</summary>
        <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {TOKEN_HELP.map((t) => (
            <li key={t.token} className="flex gap-2">
              <code className="font-mono text-brand-700 whitespace-nowrap">{t.token}</code>
              <span className="text-slate-500">{t.desc}</span>
            </li>
          ))}
        </ul>
      </details>

      <details className="card card-pad mb-5">
        <summary className="cursor-pointer font-medium">+ New template</summary>
        <form action={addTemplate} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mt-3">
          <div className="md:col-span-2">
            <label className="label">Name *</label>
            <input required name="name" className="input" placeholder="Fee due reminder" />
          </div>
          <div>
            <label className="label">Channel *</label>
            <select required name="channel" className="input" defaultValue="SMS">
              <option>SMS</option><option>WHATSAPP</option><option>EMAIL</option><option>VOICE</option>
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select name="category" className="input" defaultValue="TRANSACTIONAL">
              <option>TRANSACTIONAL</option><option>PROMOTIONAL</option><option>OTP</option>
            </select>
          </div>
          <label className="text-sm flex items-center gap-2 pt-6">
            <input type="checkbox" name="approved" /> DLT / Meta approved
          </label>
          <div className="md:col-span-3">
            <label className="label">Body *</label>
            <textarea required name="body" rows={4} className="input"
              placeholder="Dear {{parent.name}}, fee for {{student.name}} is due. Pay by {{date}}." />
            <div className="mt-2"><AIComposeButtons fieldName="body" kind="SMS" audience="PARENTS" /></div>
          </div>
          <button type="submit" className="btn-primary md:col-span-3">Save template</button>
        </form>
      </details>

      <div className="flex gap-1 mb-3">
        <Link href="/Connect/Templates" className={`text-xs px-3 py-1 rounded-full ${!channel ? "bg-brand-700 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>All</Link>
        {["SMS", "WHATSAPP", "EMAIL", "VOICE"].map((c) => (
          <Link key={c} href={`/Connect/Templates?channel=${c}`} className={`text-xs px-3 py-1 rounded-full ${channel === c ? "bg-brand-700 text-white" : "bg-slate-100 hover:bg-slate-200"}`}>{c}</Link>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Channel</th><th>Category</th><th>Body</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {templates.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No templates.</td></tr>}
            {templates.map((t) => (
              <tr key={t.id}>
                <td>
                  <details>
                    <summary className="font-medium cursor-pointer">{t.name}</summary>
                    <form action={updateTemplate} className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg mt-2">
                      <input type="hidden" name="id" value={t.id} />
                      <input name="name" defaultValue={t.name} className="input text-xs col-span-2" />
                      <select name="channel" defaultValue={t.channel} className="input text-xs">
                        <option>SMS</option><option>WHATSAPP</option><option>EMAIL</option><option>VOICE</option>
                      </select>
                      <select name="category" defaultValue={t.category ?? "TRANSACTIONAL"} className="input text-xs">
                        <option>TRANSACTIONAL</option><option>PROMOTIONAL</option><option>OTP</option>
                      </select>
                      <textarea name="body" defaultValue={t.body} rows={4} className="input text-xs col-span-2" />
                      <label className="text-xs flex items-center gap-1.5"><input type="checkbox" name="approved" defaultChecked={t.approved} /> Approved</label>
                      <label className="text-xs flex items-center gap-1.5"><input type="checkbox" name="active" defaultChecked={t.active} /> Active</label>
                      <button type="submit" className="btn-primary text-xs col-span-2">Save changes</button>
                    </form>
                  </details>
                </td>
                <td><span className="badge-blue text-xs">{t.channel}</span></td>
                <td className="text-xs">{t.category ?? "—"}</td>
                <td className="max-w-md truncate text-xs">{t.body}</td>
                <td>
                  {t.approved ? <span className="badge-green">Approved</span> : <span className="badge-amber">Pending</span>}
                  {!t.active && <div className="text-[10px] text-slate-500">Inactive</div>}
                </td>
                <td className="text-right">
                  <form action={deleteTemplate} className="inline">
                    <input type="hidden" name="id" value={t.id} />
                    <button className="text-xs text-rose-700 hover:underline">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
