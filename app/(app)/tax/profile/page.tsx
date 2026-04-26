import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveOrgTaxProfile } from "@/app/actions/tax";

export default async function OrgTaxProfilePage() {
  const session = await auth();
  const u = session!.user as any;
  const p = await prisma.orgTaxProfile.findUnique({ where: { schoolId: u.schoolId } });
  const school = await prisma.school.findUnique({ where: { id: u.schoolId } });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="h-section mb-1">Organisation tax profile</h2>
      <p className="muted mb-6">Identity and registrations the school files under.</p>

      <form action={saveOrgTaxProfile} className="card card-pad space-y-5">
        <Section title="Identity">
          <Field name="legalName" label="Legal name" defaultValue={p?.legalName ?? school?.name ?? ""} required />
          <Field name="orgType" label="Organisation type" type="select" options={["TRUST","SOCIETY","COMPANY","PROPRIETORSHIP"]} defaultValue={p?.orgType ?? "TRUST"} />
          <Field name="pan" label="PAN (school)" placeholder="AAATR1234C" defaultValue={p?.pan ?? ""} />
          <Field name="tan" label="TAN (Tax deductor)" placeholder="BLRR12345A" defaultValue={p?.tan ?? ""} />
          <Field name="cin" label="CIN (if company)" defaultValue={p?.cin ?? ""} />
        </Section>

        <Section title="Tax exemptions / GST">
          <Check name="has12ARegistration" label="12A / 12AB registered (income exempt for charitable trust)" defaultChecked={p?.has12ARegistration ?? true} />
          <Check name="has80GRegistration" label="80G registered (donations to school are deductible)" defaultChecked={p?.has80GRegistration ?? false} />
          <Field name="gstin" label="GSTIN (if applicable — most school education is exempt)" defaultValue={p?.gstin ?? ""} />
        </Section>

        <Section title="Statutory codes">
          <Field name="pfEstablishmentCode" label="EPF establishment code" defaultValue={p?.pfEstablishmentCode ?? ""} placeholder="KN/BNG/0012345" />
          <Field name="esicCode" label="ESIC code" defaultValue={p?.esicCode ?? ""} placeholder="33-12345-67" />
          <Field name="ptRegNo" label="Professional Tax Reg. No." defaultValue={p?.ptRegNo ?? ""} />
        </Section>

        <Section title="Banking (for challan deposits)">
          <Field name="bankAccountNo" label="Account number" defaultValue={p?.bankAccountNo ?? ""} />
          <Field name="bankAccountIfsc" label="IFSC code" defaultValue={p?.bankAccountIfsc ?? ""} />
        </Section>

        <Section title="Authorised signatory">
          <Field name="responsiblePersonName" label="Name" defaultValue={p?.responsiblePersonName ?? ""} />
          <Field name="responsiblePersonDesignation" label="Designation" defaultValue={p?.responsiblePersonDesignation ?? ""} />
          <Field name="signatoryPan" label="Signatory PAN" defaultValue={p?.signatoryPan ?? ""} />
        </Section>

        <div className="flex justify-end">
          <button className="btn-primary">Save profile</button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({ name, label, defaultValue, placeholder, type = "text", options, required }: any) {
  return (
    <div>
      <label className="label">{label}</label>
      {type === "select" ? (
        <select className="input" name={name} defaultValue={defaultValue}>
          {(options ?? []).map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input className="input" name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} required={required} />
      )}
    </div>
  );
}

function Check({ name, label, defaultChecked }: any) {
  return (
    <label className="flex items-start gap-2 text-sm md:col-span-2">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5" />
      <span>{label}</span>
    </label>
  );
}
