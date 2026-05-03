import Link from "next/link";
import { Mail, Phone, User } from "lucide-react";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loadSetting, saveSetting } from "@/lib/settings";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type Contacts = {
  am:  { name: string; email: string; phone: string };
  csm: { name: string; email: string; phone: string };
  billing: { name: string; email: string; phone: string };
  tech: { name: string; email: string; phone: string };
};
const DEFAULT: Contacts = {
  am:      { name: "Account Manager",    email: "am@vidyalaya.in",      phone: "+91 80000 00001" },
  csm:     { name: "Customer Success",   email: "success@vidyalaya.in", phone: "+91 80000 00002" },
  billing: { name: "Billing & Accounts", email: "billing@vidyalaya.in", phone: "+91 80000 00003" },
  tech:    { name: "Technical Support",  email: "support@vidyalaya.in", phone: "+91 80000 00004" },
};

async function save(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const cur = await loadSetting<Contacts>(u.schoolId, "supportContacts", DEFAULT);
  const next: Contacts = {
    am: {
      name:  String(form.get("amName")  ?? cur.am.name),
      email: String(form.get("amEmail") ?? cur.am.email),
      phone: String(form.get("amPhone") ?? cur.am.phone),
    },
    csm: {
      name:  String(form.get("csmName")  ?? cur.csm.name),
      email: String(form.get("csmEmail") ?? cur.csm.email),
      phone: String(form.get("csmPhone") ?? cur.csm.phone),
    },
    billing: {
      name:  String(form.get("billingName")  ?? cur.billing.name),
      email: String(form.get("billingEmail") ?? cur.billing.email),
      phone: String(form.get("billingPhone") ?? cur.billing.phone),
    },
    tech: {
      name:  String(form.get("techName")  ?? cur.tech.name),
      email: String(form.get("techEmail") ?? cur.tech.email),
      phone: String(form.get("techPhone") ?? cur.tech.phone),
    },
  };
  await saveSetting(u.schoolId, "supportContacts", next, u.id);
  revalidatePath("/support/contacts");
  redirect("/support/contacts?saved=1");
}

export const dynamic = "force-dynamic";

export default async function ContactsPage({
  searchParams,
}: { searchParams: Promise<{ saved?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER", "TEACHER", "PARENT", "STUDENT", "TRANSPORT_MANAGER", "INVENTORY_MANAGER"]);
  const sp = await searchParams;
  const c = await loadSetting<Contacts>(u.schoolId, "supportContacts", DEFAULT);
  const isAdmin = u.role === "ADMIN" || u.role === "PRINCIPAL";

  const cards: Array<[string, { name: string; email: string; phone: string }]> = [
    ["Account Manager",    c.am],
    ["Customer Success",   c.csm],
    ["Billing & Accounts", c.billing],
    ["Technical Support",  c.tech],
  ];

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <Link href="/support" className="text-xs text-brand-700 hover:underline">← Back to support</Link>
      <h1 className="h-page mt-1 mb-1">Points of contact</h1>
      <p className="muted mb-4">Your dedicated team for this school.</p>

      {sp.saved && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Saved.</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {cards.map(([role, p]) => (
          <div key={role} className="card card-pad">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 grid place-items-center"><User className="w-4 h-4" /></div>
              <div>
                <div className="text-xs text-slate-500">{role}</div>
                <div className="font-medium">{p.name}</div>
              </div>
            </div>
            <a href={`mailto:${p.email}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-brand-700">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> {p.email}
            </a>
            <a href={`tel:${p.phone.replace(/\s+/g, "")}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-brand-700 mt-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> {p.phone}
            </a>
          </div>
        ))}
      </div>

      {isAdmin && (
        <details className="card card-pad">
          <summary className="cursor-pointer font-medium">Edit contacts (Admin)</summary>
          <form action={save} className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end mt-3">
            {([
              ["am",      "Account Manager"   ],
              ["csm",     "Customer Success"  ],
              ["billing", "Billing & Accounts"],
              ["tech",    "Technical Support" ],
            ] as const).map(([key, label]) => (
              <fieldset key={key} className="border border-slate-200 rounded-lg p-3 md:col-span-2">
                <legend className="text-xs px-1 text-slate-500">{label}</legend>
                <div className="grid grid-cols-3 gap-2">
                  <input name={`${key}Name`}  defaultValue={(c as any)[key].name}  className="input text-sm" placeholder="Name" />
                  <input name={`${key}Email`} defaultValue={(c as any)[key].email} className="input text-sm" placeholder="Email" />
                  <input name={`${key}Phone`} defaultValue={(c as any)[key].phone} className="input text-sm" placeholder="Phone" />
                </div>
              </fieldset>
            ))}
            <button type="submit" className="btn-primary md:col-span-2">Save</button>
          </form>
        </details>
      )}
    </div>
  );
}
