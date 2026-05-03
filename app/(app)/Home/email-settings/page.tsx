import HomePageTabs from "@/components/HomePageTabs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { loadSetting, saveSetting } from "@/lib/settings";

type EmailSettings = {
  host: string;
  port: string;
  encryption: string;
  from: string;
  username: string;
  // password is intentionally write-only — never echo back to UI
};

const DEFAULT: EmailSettings = {
  host: "smtp.gmail.com", port: "587", encryption: "TLS",
  from: "", username: "",
};

async function save(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const next: EmailSettings = {
    host: String(form.get("host") ?? "").trim(),
    port: String(form.get("port") ?? "587").trim(),
    encryption: String(form.get("encryption") ?? "TLS"),
    from: String(form.get("from") ?? "").trim(),
    username: String(form.get("username") ?? "").trim(),
  };
  // Save the settings excluding password — passwords go to a separate, restricted
  // setting key so we can rotate independently. If the field is empty, keep existing.
  await saveSetting(u.schoolId, "emailSmtp", next, u.id);
  const pwd = String(form.get("password") ?? "");
  if (pwd) {
    await saveSetting(u.schoolId, "emailSmtpPassword", { value: pwd }, u.id);
  }
  revalidatePath("/Home/email-settings");
  redirect("/Home/email-settings?saved=1");
}

export const dynamic = "force-dynamic";

export default async function EmailSettingsPage({
  searchParams,
}: { searchParams: Promise<{ saved?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sp = await searchParams;
  const cur = await loadSetting<EmailSettings>(u.schoolId, "emailSmtp", DEFAULT);
  const hasPwd = !!(await loadSetting<{ value: string }>(u.schoolId, "emailSmtpPassword", { value: "" })).value;

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <HomePageTabs />
      <h1 className="h-page text-slate-700 mb-3">Email Settings</h1>
      {sp.saved && <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Saved.</div>}
      <form action={save} className="card card-pad space-y-3">
        <div>
          <label className="label">SMTP host</label>
          <input name="host" className="input" placeholder="smtp.example.com" defaultValue={cur.host} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Port</label>
            <input name="port" className="input" defaultValue={cur.port} />
          </div>
          <div>
            <label className="label">Encryption</label>
            <select name="encryption" className="input" defaultValue={cur.encryption}>
              <option>TLS</option><option>SSL</option><option>None</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">From address</label>
          <input name="from" className="input" placeholder="noreply@school.in" defaultValue={cur.from} />
        </div>
        <div>
          <label className="label">Username</label>
          <input name="username" className="input" defaultValue={cur.username} />
        </div>
        <div>
          <label className="label">App password {hasPwd && <span className="text-xs text-emerald-700">(stored — leave blank to keep)</span>}</label>
          <input name="password" className="input" type="password" autoComplete="new-password" />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}
