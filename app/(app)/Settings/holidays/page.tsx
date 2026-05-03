import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loadSetting, saveSetting } from "@/lib/settings";

const ALL_DAYS = [
  { v: 1, label: "Mon" },
  { v: 2, label: "Tue" },
  { v: 3, label: "Wed" },
  { v: 4, label: "Thu" },
  { v: 5, label: "Fri" },
  { v: 6, label: "Sat" },
  { v: 0, label: "Sun" },
];
const DEFAULT_WORKING = [1, 2, 3, 4, 5, 6]; // Mon-Sat

async function addHoliday(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const date = String(form.get("date") ?? "");
  const name = String(form.get("name") ?? "").trim();
  if (!date || !name) return;
  await prisma.holiday.upsert({
    where: { schoolId_date: { schoolId: u.schoolId, date: new Date(date) } },
    update: {
      name,
      category: String(form.get("category") ?? "PUBLIC"),
      fullDay: form.get("fullDay") !== "off",
      notes: String(form.get("notes") ?? "") || null,
    },
    create: {
      schoolId: u.schoolId,
      date: new Date(date),
      name,
      category: String(form.get("category") ?? "PUBLIC"),
      fullDay: form.get("fullDay") !== "off",
      notes: String(form.get("notes") ?? "") || null,
    },
  });
  revalidatePath("/Settings/holidays");
  redirect("/Settings/holidays?added=1");
}

async function deleteHoliday(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("id"));
  await prisma.holiday.deleteMany({ where: { id, schoolId: u.schoolId } });
  revalidatePath("/Settings/holidays");
}

async function saveWorkingDays(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const days: number[] = [];
  for (const d of ALL_DAYS) if (form.get(`d${d.v}`) === "on") days.push(d.v);
  await saveSetting(u.schoolId, "workingDays", { days }, u.id);
  revalidatePath("/Settings/holidays");
  redirect("/Settings/holidays?savedDays=1");
}

export const dynamic = "force-dynamic";

export default async function HolidaysPage({
  searchParams,
}: { searchParams: Promise<{ added?: string; savedDays?: string; year?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sp = await searchParams;
  const year = Number(sp.year ?? new Date().getFullYear());
  const start = new Date(year, 0, 1);
  const end   = new Date(year + 1, 0, 1);

  const [holidays, working] = await Promise.all([
    prisma.holiday.findMany({
      where: { schoolId: u.schoolId, date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    }),
    loadSetting<{ days: number[] }>(u.schoolId, "workingDays", { days: DEFAULT_WORKING }),
  ]);

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="h-page mb-1">Holidays & working days</h1>
      <p className="muted mb-4">
        These drive attendance calculations, the monthly working-day default, and the
        holiday markers shown on parent / student calendars.
      </p>

      {sp.savedDays && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Working days saved.</div>}
      {sp.added && <div className="mb-3 rounded-lg bg-emerald-50 text-emerald-900 px-3 py-2 text-sm">Holiday added.</div>}

      <section className="card card-pad mb-5">
        <h2 className="h-section mb-3">Working days of the week</h2>
        <form action={saveWorkingDays} className="flex flex-wrap gap-3 items-center">
          {ALL_DAYS.map((d) => (
            <label key={d.v} className="text-sm flex items-center gap-1.5">
              <input type="checkbox" name={`d${d.v}`} defaultChecked={working.days.includes(d.v)} />
              {d.label}
            </label>
          ))}
          <button type="submit" className="btn-primary ml-auto">Save</button>
        </form>
      </section>

      <section className="card card-pad mb-5">
        <h2 className="h-section mb-3">Add a holiday</h2>
        <form action={addHoliday} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="label">Date *</label>
            <input required type="date" name="date" className="input" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Name *</label>
            <input required name="name" className="input" placeholder="Diwali" />
          </div>
          <div>
            <label className="label">Category</label>
            <select name="category" className="input" defaultValue="PUBLIC">
              <option>PUBLIC</option><option>LOCAL</option><option>RELIGIOUS</option>
              <option>OBSERVANCE</option><option>EXAM_BREAK</option><option>VACATION</option>
            </select>
          </div>
          <label className="text-sm flex items-center gap-2 md:col-span-4">
            <input type="checkbox" name="fullDay" defaultChecked /> Full day (uncheck for half-day)
          </label>
          <div className="md:col-span-4">
            <label className="label">Notes</label>
            <input name="notes" className="input" />
          </div>
          <button type="submit" className="btn-primary md:col-span-4">Save holiday</button>
        </form>
      </section>

      <div className="flex items-center justify-between mb-3">
        <h2 className="h-section">Holidays · {year}</h2>
        <div className="flex gap-1">
          <a href={`/Settings/holidays?year=${year - 1}`} className="btn-ghost text-xs">← {year - 1}</a>
          <a href={`/Settings/holidays?year=${year + 1}`} className="btn-ghost text-xs">{year + 1} →</a>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Name</th><th>Category</th><th>Type</th><th></th></tr>
          </thead>
          <tbody>
            {holidays.length === 0 && (
              <tr><td colSpan={5} className="text-center text-slate-500 py-8">No holidays for {year}.</td></tr>
            )}
            {holidays.map((h) => (
              <tr key={h.id}>
                <td className="text-xs">{new Date(h.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</td>
                <td className="font-medium">{h.name}</td>
                <td><span className="badge-slate text-xs">{h.category}</span></td>
                <td className="text-xs">{h.fullDay ? "Full day" : "Half day"}</td>
                <td className="text-right">
                  <form action={deleteHoliday} className="inline">
                    <input type="hidden" name="id" value={h.id} />
                    <button type="submit" className="text-rose-700 text-xs hover:underline">Delete</button>
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
