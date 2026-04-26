import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function allot(form: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  const sId = (session.user as any).schoolId;
  const studentId = String(form.get("studentId"));
  const bedId = String(form.get("bedId"));
  const monthlyRent = Math.round(parseFloat(String(form.get("monthlyRent") ?? "0")) * 100);
  const securityDeposit = Math.round(parseFloat(String(form.get("securityDeposit") ?? "0")) * 100);

  // Race-safe — use update with status check
  const bed = await prisma.hostelBed.findUnique({ where: { id: bedId }, include: { building: true } });
  if (!bed || bed.status !== "VACANT") {
    revalidatePath("/Home/Hostel/management");
    return;
  }
  // Gender segregation
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return;
  if (bed.building.gender !== "MIXED" &&
      ((bed.building.gender === "BOYS" && !/male|m/i.test(student.gender)) ||
       (bed.building.gender === "GIRLS" && !/female|f/i.test(student.gender)))) {
    revalidatePath("/Home/Hostel/management");
    return;
  }

  await prisma.$transaction([
    prisma.hostelBed.update({ where: { id: bedId }, data: { status: "OCCUPIED" } }),
    prisma.hostelAllotment.create({
      data: {
        schoolId: sId,
        studentId,
        buildingId: bed.buildingId,
        bedId,
        fromDate: new Date(),
        monthlyRent,
        securityDeposit,
      },
    }),
  ]);
  revalidatePath("/Home/Hostel/management");
  revalidatePath("/Home/Hostel");
}

async function vacate(form: FormData) {
  "use server";
  const id = String(form.get("id"));
  const allotment = await prisma.hostelAllotment.findUnique({ where: { id } });
  if (!allotment) return;
  await prisma.$transaction([
    prisma.hostelAllotment.update({ where: { id }, data: { status: "VACATED", toDate: new Date() } }),
    prisma.hostelBed.update({ where: { id: allotment.bedId }, data: { status: "VACANT" } }),
  ]);
  revalidatePath("/Home/Hostel/management");
  revalidatePath("/Home/Hostel");
}

export default async function HostelMgmtPage() {
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const [students, vacantBeds, active] = await Promise.all([
    prisma.student.findMany({ where: { schoolId: sId }, include: { user: true, class: true }, take: 200 }),
    prisma.hostelBed.findMany({ where: { building: { schoolId: sId }, status: "VACANT" }, include: { building: true, room: true } }),
    prisma.hostelAllotment.findMany({ where: { schoolId: sId, status: "ACTIVE" }, include: { building: true, bed: { include: { room: true } } } }),
  ]);
  const sMap = new Map(students.map((s) => [s.id, s]));
  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <h1 className="h-page mb-3">Hostel Management</h1>

      <h2 className="h-section mb-2">New allotment</h2>
      <form action={allot} className="card card-pad mb-5 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="label">Student *</label>
          <select required name="studentId" className="input">
            <option value="" disabled>— Select —</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.admissionNo} · {s.user.name} · {s.gender}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Bed *</label>
          <select required name="bedId" className="input">
            <option value="" disabled>— Vacant beds —</option>
            {vacantBeds.map((b) => (
              <option key={b.id} value={b.id}>{b.building.name} · {b.building.gender} · Room {b.room.number} · Bed {b.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">Rent ₹/mo</label><input className="input" type="number" name="monthlyRent" defaultValue="5000" /></div>
          <div><label className="label">Deposit</label><input className="input" type="number" name="securityDeposit" defaultValue="10000" /></div>
        </div>
        <button className="btn-primary md:col-span-5">Allot</button>
      </form>

      <h2 className="h-section mb-2">Active allotments</h2>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Building</th><th>Room/Bed</th><th>Student</th><th>From</th><th>Rent</th><th></th></tr></thead>
          <tbody>
            {active.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-8">No active allotments.</td></tr>}
            {active.map((a) => {
              const s = sMap.get(a.studentId);
              return (
                <tr key={a.id}>
                  <td>{a.building.name}</td>
                  <td>{a.bed.room.number} / {a.bed.label}</td>
                  <td>{s?.user.name ?? a.studentId}</td>
                  <td className="text-xs">{new Date(a.fromDate).toLocaleDateString("en-IN")}</td>
                  <td>₹{(a.monthlyRent / 100).toLocaleString("en-IN")}</td>
                  <td className="text-right">
                    <form action={vacate}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="btn-outline text-xs px-3 py-1">Vacate</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
