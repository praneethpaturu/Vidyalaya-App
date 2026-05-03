import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { loadSetting, saveSetting } from "@/lib/settings";

type VisitorSettings = {
  capturePhoto: boolean;
  hostOtp: boolean;
  autoBadge: boolean;
  blockBanned: boolean;
  captureVehicle: boolean;
  mandatoryId: boolean;
  closingTime: string;
  badgeExpiry: string;
};

const DEFAULT: VisitorSettings = {
  capturePhoto: true, hostOtp: false, autoBadge: true,
  blockBanned: true, captureVehicle: true, mandatoryId: true,
  closingTime: "21:00", badgeExpiry: "Same day",
};

async function save(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TRANSPORT_MANAGER"]);
  await saveSetting(u.schoolId, "visitorMgmt", {
    capturePhoto: form.get("capturePhoto") === "on",
    hostOtp: form.get("hostOtp") === "on",
    autoBadge: form.get("autoBadge") === "on",
    blockBanned: form.get("blockBanned") === "on",
    captureVehicle: form.get("captureVehicle") === "on",
    mandatoryId: form.get("mandatoryId") === "on",
    closingTime: String(form.get("closingTime") ?? "21:00"),
    badgeExpiry: String(form.get("badgeExpiry") ?? "Same day"),
  } satisfies VisitorSettings, u.id);
  revalidatePath("/Home/Visitor_Mgmt/settings");
  redirect("/Home/Visitor_Mgmt/settings?saved=1");
}

export const dynamic = "force-dynamic";

export default async function VisitorSettingsPage({
  searchParams,
}: { searchParams: Promise<{ saved?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TRANSPORT_MANAGER"]);
  const sp = await searchParams;
  const cur = await loadSetting<VisitorSettings>(u.schoolId, "visitorMgmt", DEFAULT);

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="h-page mb-3">Visitor Mgmt Settings</h1>
      {sp.saved && <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Saved.</div>}
      <form action={save} className="card card-pad space-y-3">
        <Toggle label="Capture photo (webcam)" name="capturePhoto" defaultOn={cur.capturePhoto} />
        <Toggle label="Send OTP to host before allowing entry" name="hostOtp" defaultOn={cur.hostOtp} />
        <Toggle label="Print badge automatically on Check-In" name="autoBadge" defaultOn={cur.autoBadge} />
        <Toggle label="Block banned visitors by phone" name="blockBanned" defaultOn={cur.blockBanned} />
        <Toggle label="Capture vehicle number" name="captureVehicle" defaultOn={cur.captureVehicle} />
        <Toggle label="Mandatory ID proof (Aadhaar / DL / etc.)" name="mandatoryId" defaultOn={cur.mandatoryId} />
        <hr />
        <div>
          <label className="label">Closing time auto check-out</label>
          <select name="closingTime" defaultValue={cur.closingTime} className="input">
            <option>21:00</option><option>22:00</option><option>None</option>
          </select>
        </div>
        <div>
          <label className="label">Badge expiry</label>
          <select name="badgeExpiry" defaultValue={cur.badgeExpiry} className="input">
            <option>Same day</option><option>4 hours</option><option>2 hours</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary">Save</button>
        </div>
      </form>
    </div>
  );
}

function Toggle({ label, name, defaultOn }: { label: string; name: string; defaultOn?: boolean }) {
  return (
    <label className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultOn} className="h-4 w-7 rounded-full" />
    </label>
  );
}
