import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function LearnerProfilePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const sp = await searchParams;
  const session = await auth();
  const sId = (session!.user as any).schoolId;
  const students = await prisma.student.findMany({
    where: { schoolId: sId }, include: { user: true, class: true }, orderBy: { admissionNo: "asc" }, take: 200,
  });
  const studentId = sp.id ?? students[0]?.id;
  if (!studentId) return <div className="p-5">No students.</div>;

  const [s, attendance, submissions, invoices, allotment] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true, class: true, busStop: { include: { route: true } } },
    }),
    prisma.classAttendance.findMany({ where: { studentId }, take: 30, orderBy: { date: "desc" } }),
    prisma.submission.findMany({ where: { studentId }, take: 10, orderBy: { gradedAt: "desc" }, include: { assignment: true } }),
    prisma.invoice.findMany({ where: { studentId } }),
    prisma.hostelAllotment.findFirst({ where: { studentId, status: "ACTIVE" }, include: { building: true, bed: { include: { room: true } } } }),
  ]);
  if (!s) return <div className="p-5">Student not found.</div>;

  const totalAtt = attendance.length;
  const presentAtt = attendance.filter((a) => a.status === "PRESENT").length;
  const dues = invoices.reduce((acc, i) => acc + (i.total - i.amountPaid), 0);

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h1 className="h-page">Learner Profile</h1>
          <p className="muted">360-degree view: demographics, academics, attendance, behavior, achievements, finance.</p>
        </div>
        <form className="flex gap-2 items-center">
          <select className="input w-72" name="id" defaultValue={studentId}>
            {students.map((st) => <option key={st.id} value={st.id}>{st.admissionNo} · {st.user.name}</option>)}
          </select>
          <button className="btn-tonal text-sm">View</button>
        </form>
      </div>

      <div className="card card-pad mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-medium">{s.user.name}</div>
            <div className="text-sm text-slate-500">{s.class?.name} · Roll {s.rollNo} · Adm {s.admissionNo}</div>
          </div>
          <div className="text-right text-xs text-slate-500">DOB {new Date(s.dob).toLocaleDateString("en-IN")}<br />Gender {s.gender}<br />Blood {s.bloodGroup ?? "—"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Tile label="Attendance" value={totalAtt > 0 ? `${Math.round((presentAtt / totalAtt) * 100)}%` : "—"} />
        <Tile label="Submissions" value={submissions.length} />
        <Tile label="Outstanding fees" value={`₹${(dues / 100).toLocaleString("en-IN")}`} />
        <Tile label="Bus / Hostel" value={s.busStop?.name ?? (allotment ? `${allotment.building.name} ${allotment.bed.room.number}` : "—")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card overflow-x-auto">
          <div className="px-4 py-3 border-b text-sm font-medium">Recent attendance (30 days)</div>
          <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {attendance.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">No attendance.</li>}
            {attendance.map((a) => (
              <li key={a.id} className="px-4 py-2 flex justify-between text-sm">
                <span>{new Date(a.date).toLocaleDateString("en-IN")}</span>
                <span className={
                  a.status === "PRESENT" ? "badge-green"
                    : a.status === "ABSENT" ? "badge-red"
                    : a.status === "LATE" ? "badge-amber"
                    : "badge-blue"
                }>{a.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card overflow-x-auto">
          <div className="px-4 py-3 border-b text-sm font-medium">Recent submissions</div>
          <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {submissions.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">No submissions.</li>}
            {submissions.map((sb) => (
              <li key={sb.id} className="px-4 py-2.5 text-sm flex justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{sb.assignment.title}</div>
                  <div className="text-xs text-slate-500">{sb.gradedAt ? `Graded ${new Date(sb.gradedAt).toLocaleDateString("en-IN")}` : sb.status}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{sb.grade ?? "—"}</div>
                  <div className="text-[10px] text-slate-500">/ {sb.assignment.maxPoints}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <Link href={`/students/${s.id}`} className="card card-pad hover:bg-slate-50 col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Open full student record →</span>
            <span className="text-xs text-slate-500">/students/{s.id}</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: any }) {
  return (
    <div className="card card-pad">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-2xl font-medium tracking-tight">{value}</div>
    </div>
  );
}
